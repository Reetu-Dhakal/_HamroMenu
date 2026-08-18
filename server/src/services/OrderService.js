import Order, { ORDER_STATUS } from '../models/Order.js';
import orderRepository from '../repositories/OrderRepository.js';
import cartService from './CartService.js';
import menuService from './MenuService.js';
import restaurantRepository from '../repositories/RestaurantRepository.js';
import customerService from './CustomerService.js';
import notificationService from './NotificationService.js';
import FeatureGateService from './FeatureGateService.js';
import ApiError, { ErrorCodes } from '../utils/ApiError.js';
import mongoose from 'mongoose';

class OrderService {
  constructor() {
    this.repo = orderRepository;
  }

  estimateWaitMinutes(order) {
    const basePrep = order.items.reduce((sum, it) => sum + (it.prepTimeMinutes || 0) * it.quantity, 0);
    return Math.max(5, Math.round(basePrep));
  }

  async placeOrder(customerId, { restaurantId, tableId, notes, customerNote, specialRequests, paymentMethod = 'pay_after_meal', source = 'qr' } = {}) {
    // 1. Check plan limits before allowing order
    const canOrder = await FeatureGateService.canAddMenuItem(restaurantId);
    if (!canOrder) {
      const sub = await Subscription.findOne({ restaurant: restaurantId }).populate('plan');
      const planName = sub?.plan?.name || 'unknown';
      throw new ApiError(403, `Cannot place order - maximum menu items reached on ${planName} plan. Upgrade your plan.`);
    }

    // 2. Check subscription status - restrict orders on EXPIRED/PAST_DUE subscriptions
    const subscription = await Subscription.findOne({ restaurant: restaurantId });
    if (subscription) {
      if (subscription.status === 'EXPIRED') {
        throw new ApiError(403, 'Subscription has expired. Please renew your subscription to continue taking orders.');
      }
      if (subscription.status === 'PAST_DUE') {
        throw new ApiError(403, 'Subscription is past due. Please update payment to continue taking orders.');
      }
      if (subscription.status === 'TRIALING') {
        // Trial restaurants can take orders, but will be restricted after trial ends
      }
    }

    const cart = await cartService.getCart(customerId, restaurantId);
    if (cart.isEmpty()) throw new ApiError(400, 'Cart is empty', null, ErrorCodes.CART_EMPTY);
    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) throw new ApiError(404, 'Restaurant not found', null, ErrorCodes.NOT_FOUND);

    const orderItems = cart.items.map((it) => ({
      menuItem: it.menuItem,
      name: it.name,
      price: it.unitPrice,
      quantity: it.quantity,
      lineTotal: it.lineTotal,
      specialInstructions: it.specialInstructions,
      options: it.options,
      optionsLabel: it.optionsLabel,
      imageUrl: it.imageUrl,
      prepTimeMinutes: it.prepTimeMinutes || 0,
    }));

    const order = new Order({
      _id: new mongoose.Types.ObjectId(),
      orderNumber: await this.repo.nextOrderNumber(restaurantId),
      restaurant: restaurantId,
      table: cart.table || tableId || null,
      customer: customerId,
      source,
      items: orderItems,
      discountTotal: cart.discountTotal,
      tax: cart.tax,
      serviceCharge: cart.serviceCharge,
      coupon: cart.coupon,
      couponCode: cart.appliedCoupon?.code || '',
      paymentMethod,
      notes,
      customerNote,
      specialRequests: specialRequests || notes || '',
    });

    const subtotal = order.items.reduce((s, it) => s + it.lineTotal, 0);
    order.subtotal = Math.round(subtotal * 100) / 100;
    order.grandTotal = Math.round((subtotal + order.tax + order.serviceCharge - order.discountTotal) * 100) / 100;
    order.itemCount = order.items.reduce((s, it) => s + it.quantity, 0);
    order.prepTimeTotal = order.items.reduce((s, it) => s + (it.prepTimeMinutes || 0) * it.quantity, 0);
    order.estimatedReadyAt = new Date(Date.now() + this.estimateWaitMinutes(order) * 60000);
    order.statusHistory.push({ status: ORDER_STATUS.PENDING, at: new Date(), note: 'Order placed by customer' });

    await order.save();

    if (order.table) {
      await restaurantRepository.updateTable(order.table, { status: 'occupied', currentOrder: order._id });
    }
    await menuService.repo.incrementOrderCounts(orderItems);
    if (cart.coupon) await menuService.markCouponUsed(cart.coupon);
    await customerService.incrementOrderCount(customerId);
    await cartService.clear(customerId, restaurantId);

    notificationService.emitToRestaurant(restaurantId, 'order:new', order.toObject());
    return order;
  }

  async getById(orderId) {
    const order = await this.repo.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found', null, ErrorCodes.NOT_FOUND);
    return order;
  }

  async getForCustomer(orderId, customerId) {
    const order = await this.repo.findOne({ _id: orderId, customer: customerId });
    if (!order) throw new ApiError(404, 'Order not found', null, ErrorCodes.NOT_FOUND);
    return order;
  }

  async history(customerId, { page = 1, limit = 20 } = {}) {
    const data = await this.repo.paginate({ customer: customerId }, { page, limit, sort: { placedAt: -1 } });
    return { orders: data.docs, pagination: { page, limit, total: data.total, totalPages: data.totalPages } };
  }

  async listForRestaurant(restaurantId, { status, page = 1, limit = 20, search = '' } = {}) {
    const filter = { restaurant: restaurantId };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'items.name': { $regex: search, $options: 'i' } },
      ];
    }
    const data = await this.repo.paginate(filter, { page, limit, sort: { placedAt: -1 }, populate: 'table' });
    return { orders: data.docs, pagination: { page, limit, total: data.total, totalPages: data.totalPages } };
  }

  async changeStatus(orderId, toStatus, actor, note = '') {
    const order = await this.getById(orderId);

    if (toStatus === ORDER_STATUS.PREPARING && order.status === ORDER_STATUS.PENDING) {
      order.setStatus(ORDER_STATUS.CONFIRMED, actor?._id, 'Auto-confirmed');
    }
    order.setStatus(toStatus, actor?._id, note);
    if (toStatus === ORDER_STATUS.CONFIRMED) order.confirmedBy = actor?._id;
    if (toStatus === ORDER_STATUS.PREPARING) order.acceptedBy = actor?._id;
    if (toStatus === ORDER_STATUS.SERVED) order.servedBy = actor?._id;

    await order.save();

    if ([ORDER_STATUS.SERVED, ORDER_STATUS.CANCELLED].includes(toStatus) && order.table) {
      await restaurantRepository.updateTable(order.table, { status: 'free', currentOrder: null });
    }

    notificationService.emitToRestaurant(order.restaurant, 'order:status', {
      orderId: order._id,
      status: toStatus,
      orderNumber: order.orderNumber,
    });
    notificationService.emitToCustomer(order.customer, 'order:status', {
      orderId: order._id,
      status: toStatus,
      orderNumber: order.orderNumber,
    });
    return order;
  }

  async confirmOrder(orderId, staff) {
    return this.changeStatus(orderId, ORDER_STATUS.CONFIRMED, staff, `Confirmed by ${staff?.name || 'staff'}`);
  }

  async kitchenQueue(restaurantId) {
    return Order.find({
      restaurant: restaurantId,
      status: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING] },
    })
      .sort({ placedAt: 1 })
      .limit(60);
  }

  async readyOrders(restaurantId) {
    return Order.find({ restaurant: restaurantId, status: ORDER_STATUS.READY }).populate('table');
  }

  async activeOrderForTable(tableId) {
    return this.repo.model
      .findOne({
        table: tableId,
        status: { $nin: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED] },
      })
      .sort({ placedAt: -1 });
  }

  async cancelOrder(orderId, actor, reason = '') {
    const order = await this.getById(orderId);
    if (order.isTerminal()) throw new ApiError(400, 'Order already finished');
    order.setStatus(ORDER_STATUS.CANCELLED, actor?._id, reason || 'Cancelled');
    if (order.table) {
      await restaurantRepository.updateTable(order.table, { status: 'free', currentOrder: null });
    }
    await order.save();
    notificationService.emitToRestaurant(order.restaurant, 'order:status', {
      orderId: order._id,
      status: ORDER_STATUS.CANCELLED,
      orderNumber: order.orderNumber,
    });
    return order;
  }
}

export default new OrderService();