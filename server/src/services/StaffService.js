import RestaurantRepository from '../repositories/RestaurantRepository.js';
import Order, { ORDER_STATUS } from '../models/Order.js';
import PaymentService from './PaymentService.js';
import notificationService from './NotificationService.js';
import ApiError, { ErrorCodes } from '../utils/ApiError.js';

class StaffService {
  constructor() {
    this.restaurants = RestaurantRepository;
  }

  async dashboard(restaurantId, staffId) {
    const tables = await this.restaurants.tablesFor(restaurantId);
    const [newOrders, preparing, ready, unpaid, completedToday] = await Promise.all([
      this.count(restaurantId, ORDER_STATUS.PENDING),
      this.count(restaurantId, ORDER_STATUS.PREPARING),
      this.count(restaurantId, ORDER_STATUS.READY),
      Order.countDocuments({ restaurant: restaurantId, paymentStatus: 'unpaid' }),
      this.completedToday(restaurantId),
    ]);
    return { tables, counts: { newOrders, preparing, ready, unpaid, completedToday } };
  }

  async count(restaurantId, status) {
    return Order.countDocuments({ restaurant: restaurantId, status });
  }

  async completedToday(restaurantId) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return Order.countDocuments({ restaurant: restaurantId, status: ORDER_STATUS.COMPLETED, completedAt: { $gte: start } });
  }

  async serveOrder(orderId, staff) {
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');
    if (order.status === ORDER_STATUS.READY) {
      order.setStatus(ORDER_STATUS.SERVED, staff?._id, 'Served by staff');
      order.servedBy = staff?._id;
      await order.save();
      if (order.table) {
        await this.restaurants.updateTable(order.table, { status: 'free', currentOrder: null });
      }
      notificationService.emitToRestaurant(order.restaurant, 'order:status', {
        orderId: order._id,
        status: ORDER_STATUS.SERVED,
        orderNumber: order.orderNumber,
      });
      notificationService.emitToCustomer(order.customer, 'order:status', {
        orderId: order._id,
        status: ORDER_STATUS.SERVED,
        orderNumber: order.orderNumber,
      });
    }
    return order;
  }

  async generateBill(orderId) {
    const order = await Order.findById(orderId).populate('table').populate('customer');
    if (!order) throw new ApiError(404, 'Order not found');
    return {
      orderNumber: order.orderNumber,
      items: order.items,
      subtotal: order.subtotal,
      discountTotal: order.discountTotal,
      tax: order.tax,
      serviceCharge: order.serviceCharge,
      grandTotal: order.grandTotal,
      table: order.table,
      customer: order.customer,
      placedAt: order.placedAt,
    };
  }

  async collectCash(orderId, staffId) {
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');
    let payment = await PaymentService.getForOrder(orderId);
    if (!payment) {
      payment = await PaymentService.createPayment({
        order: orderId,
        restaurant: order.restaurant,
        customer: order.customer,
        table: order.table,
        amount: order.grandTotal,
        method: 'cash',
      });
    }
    await PaymentService.markCashPaid(payment._id, staffId);
    if (order.status === ORDER_STATUS.SERVED) {
      order.setStatus(ORDER_STATUS.COMPLETED, staffId, 'Paid and completed');
      await order.save();
    }
    return { order, payment };
  }

  async tablesWithOrders(restaurantId) {
    const tables = await this.restaurants.tablesFor(restaurantId);
    const orders = await Order.find({
      restaurant: restaurantId,
      status: { $nin: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED] },
    });
    const map = {};
    orders.forEach((o) => {
      map[o.table] = o;
    });
    return tables.map((t) => ({ ...t.toObject(), activeOrder: map[t._id] || null }));
  }
}

export default new StaffService();