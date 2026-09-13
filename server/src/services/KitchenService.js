import Order, { ORDER_STATUS } from '../models/Order.js';
import notificationService from './NotificationService.js';
import { assertSameRestaurant } from '../middleware/restaurantAuth.js';
import ApiError from '../utils/ApiError.js';

/**
 * KitchenPriorityQueue — max-heap on urgency score.
 * Higher score = more urgent = dequeues first.
 * score = waitMinutes * 2 + statusWeight + itemLoadWeight
 *   statusWeight: pending=100, confirmed=80, preparing=50, ready=10
 *   itemLoadWeight: +2 per item (larger tickets slightly more urgent)
 * Wait time dominates over time so long-waiting orders naturally rise.
 * Tie-break (deterministic): higher score → earlier placedAt → smaller _id.
 */
class KitchenPriorityQueue {
  constructor() {
    this.heap = [];
  }

  score(order) {
    const waitMinutes = Math.max(0, (Date.now() - new Date(order.placedAt).getTime()) / 60000);
    const statusWeight = { pending: 100, confirmed: 80, preparing: 50, ready: 10 };
    const itemCount = Array.isArray(order.items) ? order.items.length : 0;
    return Math.max(0, waitMinutes * 2 + (statusWeight[order.status] ?? 0) + itemCount * 2);
  }

  priorityLabel(score) {
    if (score >= 120) return 'high';
    if (score >= 70) return 'medium';
    return 'low';
  }

  toNode(order) {
    return {
      order,
      priority: this.score(order),
      placedAtMs: new Date(order.placedAt).getTime() || 0,
      idStr: String(order._id || ''),
    };
  }

  /**
   * Deterministic ordering: higher score first, then earlier placedAt,
   * then order ID string comparison as final tie-break.
   */
  higherPriority(a, b) {
    if (a.priority !== b.priority) return a.priority > b.priority;
    if (a.placedAtMs !== b.placedAtMs) return a.placedAtMs < b.placedAtMs;
    return a.idStr < b.idStr;
  }

  enqueue(order) {
    this.heap.push(this.toNode(order));
    this.heapifyUp(this.heap.length - 1);
  }

  dequeue() {
    if (this.heap.length === 0) return null;
    const max = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.heapifyDown(0);
    }
    return max.order;
  }

  peek() {
    if (this.heap.length === 0) return null;
    return this.heap[0].order;
  }

  rebalance() {
    this.heap.forEach((h) => {
      h.priority = this.score(h.order);
      h.placedAtMs = new Date(h.order.placedAt).getTime() || 0;
      h.idStr = String(h.order._id || '');
    });
    this.heapify();
  }

  /** Max-heap with deterministic tie-break (score → placedAt → _id). */
  heapifyUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.higherPriority(this.heap[parentIndex], this.heap[index])) break;
      [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
      index = parentIndex;
    }
  }

  heapifyDown(index) {
    const lastIndex = this.heap.length - 1;
    while (true) {
      let largest = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      if (leftChild <= lastIndex && this.higherPriority(this.heap[leftChild], this.heap[largest])) {
        largest = leftChild;
      }
      if (rightChild <= lastIndex && this.higherPriority(this.heap[rightChild], this.heap[largest])) {
        largest = rightChild;
      }
      if (largest === index) break;
      [this.heap[largest], this.heap[index]] = [this.heap[index], this.heap[largest]];
      index = largest;
    }
  }

  heapify() {
    for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
      this.heapifyDown(i);
    }
  }

  /** Drain the heap in priority order (highest urgency first). */
  drainSorted() {
    const out = [];
    while (this.heap.length) out.push(this.dequeue());
    return out;
  }
}

class KitchenService {
  constructor() {
    // NOTE: named `pq` (not `queue`) so it never shadows the queue() method.
    this.pq = new KitchenPriorityQueue();
    this.Order = Order;
  }

  /**
   * Priority-ordered kitchen queue. The backend (not the frontend) is the
   * source of truth: orders are pushed through KitchenPriorityQueue and
   * returned highest-urgency-first with rank + priority label.
   */
  async queue(restaurantId) {
    const orders = await Order.find({
      restaurant: restaurantId,
      status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY] },
    })
      .limit(60)
      .populate('table')
      .select('orderNumber table items status placedAt priority estimatedReadyAt prepTimeTotal');

    const pq = new KitchenPriorityQueue();
    for (const o of orders) pq.enqueue(o.toObject());
    const sorted = pq.drainSorted();
    return sorted.map((plain, idx) => {
      const score = pq.score(plain) || 0;
      return {
        ...plain,
        waitMinutes: this.waitMinutes(plain),
        priority: Math.round(score * 100) / 100,
        priorityRank: idx + 1,
        priorityLabel: pq.priorityLabel(score),
      };
    });
  }

  waitMinutes(order) {
    const placed = new Date(order.placedAt).getTime();
    const elapsed = (Date.now() - placed) / 60000;
    return Math.max(0, Math.round(elapsed));
  }

  enqueueOrder(order) {
    this.pq.enqueue(order);
  }

  dequeueOrder() {
    return this.pq.dequeue();
  }

  async accept(orderId, kitchenUser) {
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');
    if (kitchenUser) assertSameRestaurant(kitchenUser, order.restaurant, 'Access denied to this order');
    if (order.status === ORDER_STATUS.PENDING) order.setStatus(ORDER_STATUS.CONFIRMED, kitchenUser._id, 'Accepted by kitchen');
    order.setStatus(ORDER_STATUS.PREPARING, kitchenUser._id, 'Kitchen started preparing');
    order.acceptedBy = kitchenUser._id;
    await order.save();
    notificationService.emitToRestaurant(order.restaurant, 'order:status', {
      orderId: order._id,
      status: ORDER_STATUS.PREPARING,
      orderNumber: order.orderNumber,
    });
    return order;
  }

  async markItemReady(orderId, itemId, kitchenUser) {
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');
    if (kitchenUser) assertSameRestaurant(kitchenUser, order.restaurant, 'Access denied to this order');
    const item = order.items.id(itemId);
    if (!item) throw new ApiError(404, 'Order item not found');
    item.status = ORDER_STATUS.READY;
    await order.save();
    const allReady = order.items.every((it) => it.status === ORDER_STATUS.READY);
    if (allReady && order.status === ORDER_STATUS.PREPARING) {
      order.setStatus(ORDER_STATUS.READY, kitchenUser._id, 'All items ready');
      await order.save();
    }
    notificationService.emitToRestaurant(order.restaurant, 'order:item-status', {
      orderId: order._id,
      itemId,
      status: ORDER_STATUS.READY,
    });
    return order;
  }

  async readyOrder(orderId, kitchenUser) {
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');
    if (kitchenUser) assertSameRestaurant(kitchenUser, order.restaurant, 'Access denied to this order');
    if (order.status === ORDER_STATUS.PREPARING) {
      order.setStatus(ORDER_STATUS.READY, kitchenUser._id, 'Order ready to serve');
      await order.save();
    }
    notificationService.emitToRestaurant(order.restaurant, 'order:status', {
      orderId: order._id,
      status: ORDER_STATUS.READY,
      orderNumber: order.orderNumber,
    });
    return order;
  }

  async stats(restaurantId) {
    const [pending, preparing, ready, total] = await Promise.all([
      Order.countDocuments({ restaurant: restaurantId, status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED] } }),
      Order.countDocuments({ restaurant: restaurantId, status: ORDER_STATUS.PREPARING }),
      Order.countDocuments({ restaurant: restaurantId, status: ORDER_STATUS.READY }),
      Order.countDocuments({ restaurant: restaurantId, status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING] } }),
    ]);
    return { pending, preparing, ready, total };
  }
}

export default new KitchenService();