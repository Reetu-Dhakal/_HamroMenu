import Order, { ORDER_STATUS } from '../models/Order.js';
import notificationService from './NotificationService.js';
import ApiError from '../utils/ApiError.js';

class KitchenService {
  constructor() {
    this.Order = Order;
  }

  async queue(restaurantId) {
    const orders = await Order.find({
      restaurant: restaurantId,
      status: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING] },
    })
      .sort({ placedAt: 1, createdAt: 1 })
      .limit(60)
      .select('orderNumber table items status placedAt priority estimatedReadyAt prepTimeTotal');

    return orders.map((o) => ({
      ...o.toObject(),
      waitMinutes: this.waitMinutes(o),
    }));
  }

  waitMinutes(order) {
    const placed = new Date(order.placedAt).getTime();
    const elapsed = (Date.now() - placed) / 60000;
    return Math.max(0, Math.round(elapsed));
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
      Order.countDocuments({ restaurant: restaurantId, status: ORDER_STATUS.CONFIRMED }),
      Order.countDocuments({ restaurant: restaurantId, status: ORDER_STATUS.PREPARING }),
      Order.countDocuments({ restaurant: restaurantId, status: ORDER_STATUS.READY }),
      Order.countDocuments({ restaurant: restaurantId, status: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY] } }),
    ]);
    return { pending, preparing, ready, total };
  }
}

export default new KitchenService();