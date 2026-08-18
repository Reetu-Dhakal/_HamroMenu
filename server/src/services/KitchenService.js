import Order, { ORDER_STATUS } from '../models/Order.js';
import notificationService from './NotificationService.js';
import ApiError from '../utils/ApiError.js';

class KitchenPriorityQueue {
  constructor() {
    this.heap = [];
  }

  score(order) {
    const waitMinutes = (Date.now() - new Date(order.placedAt)) / 60000;
    const statusWeight = { pending: 100, confirmed: 80, preparing: 50, ready: 10 };
    return Math.max(0, waitMinutes * 2 + (statusWeight[order.status] || 0));
  }

  enqueue(order) {
    this.heap.push({ order, priority: this.score(order) });
    this.heapifyUp(this.heap.length - 1);
  }

  dequeue() {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.heapifyDown(0);
    }
    return min.order;
  }

  peek() {
    if (this.heap.length === 0) return null;
    return this.heap[0].order;
  }

  rebalance() {
    this.heap.forEach((h, i) => {
      h.priority = this.score(h.order);
    });
    this.heapify();
  }

  heapifyUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[parentIndex].priority <= this.heap[index].priority) break;
      [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
      index = parentIndex;
    }
  }

  heapifyDown(index) {
    const lastIndex = this.heap.length - 1;
    while (true) {
      let smallest = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      if (leftChild <= lastIndex && this.heap[leftIndex].priority < this.heap[smallest].priority) {
        smallest = leftChild;
      }
      if (rightChild <= lastIndex && this.heap[rightChild].priority < this.heap[smallest].priority) {
        smallest = rightChild;
      }
      if (smallest === index) break;
      [this.heap[smallest], this.heap[index]] = [this.heap[index], this.heap[smallest]];
      index = smallest;
    }
  }

  heapify() {
    for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
      this.heapifyDown(i);
    }
  }
}

class KitchenService {
  constructor() {
    this.queue = new KitchenPriorityQueue();
    this.Order = Order;
  }

  async queue(restaurantId) {
    const orders = await Order.find({
      restaurant: restaurantId,
      status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY] },
    })
      .sort({ placedAt: 1, createdAt: 1 })
      .limit(60)
      .populate('table')
      .select('orderNumber table items status placedAt priority estimatedReadyAt prepTimeTotal');

    return orders.map((o) => ({
      ...o.toObject(),
      waitMinutes: this.waitMinutes(o),
      priority: this.queue.score({ ...o.toObject(), placedAt: o.placedAt }) || 0,
    }));
  }

  waitMinutes(order) {
    const placed = new Date(order.placedAt).getTime();
    const elapsed = (Date.now() - placed) / 60000;
    return Math.max(0, Math.round(elapsed));
  }

  enqueueOrder(order) {
    this.queue.enqueue(order);
  }

  dequeueOrder() {
    return this.queue.dequeue();
  }

  async accept(orderId, kitchenUser) {
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');
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