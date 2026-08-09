import RestaurantRepository from '../repositories/RestaurantRepository.js';
import BaseRepository from '../repositories/BaseRepository.js';
import Order, { ORDER_STATUS } from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Payment from '../models/Payment.js';
import Review from '../models/Review.js';
import Coupon from '../models/Coupon.js';
import mongoose from 'mongoose';

class AdminService {
  constructor() {
    this.restaurants = RestaurantRepository;
    this.payments = new BaseRepository(Payment);
  }

  async overview(restaurantId) {
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    const rid = new mongoose.Types.ObjectId(restaurantId);

    const [
      totalOrders,
      todayOrders,
      activeOrders,
      totalRevenueRes,
      todayRevenueRes,
      avgRatingRes,
      totalItems,
    ] = await Promise.all([
      Order.countDocuments({ restaurant: rid }),
      Order.countDocuments({ restaurant: rid, placedAt: { $gte: startToday } }),
      Order.countDocuments({
        restaurant: rid,
        status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY] },
      }),
      Order.aggregate([
        { $match: { restaurant: rid, status: { $ne: ORDER_STATUS.CANCELLED } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { restaurant: rid, placedAt: { $gte: startToday }, status: { $ne: ORDER_STATUS.CANCELLED } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } },
      ]),
      Review.aggregate([{ $match: { restaurant: rid } }, { $group: { _id: null, avg: { $avg: '$rating' } } }]),
      MenuItem.countDocuments({ restaurant: rid }),
    ]);

    const totalCustomers = (await Order.distinct('customer', { restaurant: rid })).length;

    const totalRevenue = totalRevenueRes[0]?.total || 0;
    const totalOrderCount = totalRevenueRes[0]?.count || 0;

    return {
      counts: {
        totalOrders,
        todayOrders,
        activeOrders,
        totalCustomers,
        totalItems,
      },
      revenue: {
        total: totalRevenue,
        today: todayRevenueRes[0]?.total || 0,
      },
      avgRating: avgRatingRes.length ? Math.round(avgRatingRes[0].avg * 10) / 10 : 0,
      avgOrderValue: totalOrderCount ? Math.round((totalRevenue / totalOrderCount) * 100) / 100 : 0,
    };
  }

  async revenue(restaurantId, { from, to } = {}) {
    const match = { restaurant: new mongoose.Types.ObjectId(restaurantId), status: { $ne: ORDER_STATUS.CANCELLED } };
    if (from || to) match.placedAt = {};
    if (from) match.placedAt.$gte = new Date(from);
    if (to) match.placedAt.$lte = new Date(to);

    const [daily, byMethod] = await Promise.all([
      Order.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$placedAt' } },
            revenue: { $sum: '$grandTotal' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: match },
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$grandTotal' } } },
      ]),
    ]);
    return { daily, byMethod };
  }

  async popularItems(restaurantId, limit = 8) {
    return MenuItem.find({ restaurant: restaurantId })
      .sort({ orderCount: -1 })
      .limit(limit)
      .select('name price orderCount imageUrl isVeg isPopular');
  }

  async peakHours(restaurantId) {
    return Order.aggregate([
      {
        $match: { restaurant: new mongoose.Types.ObjectId(restaurantId), status: { $ne: ORDER_STATUS.CANCELLED } },
      },
      { $group: { _id: { $hour: '$placedAt' }, orders: { $sum: 1 } } },
      { $sort: { orders: -1 } },
    ]);
  }

  async tableTurnover(restaurantId) {
    const completed = await Order.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          status: ORDER_STATUS.COMPLETED,
          table: { $ne: null },
        },
      },
      { $group: { _id: '$table', count: { $sum: 1 }, total: { $sum: '$grandTotal' } } },
    ]);
    const tables = await this.restaurants.tablesFor(restaurantId);
    const map = {};
    completed.forEach((c) => (map[c._id] = c));
    return tables.map((t) => ({
      ...t.toObject(),
      turnover: map[t._id]?.count || 0,
      revenue: map[t._id]?.total || 0,
    }));
  }

  async statusDistribution(restaurantId) {
    return Order.aggregate([
      { $match: { restaurant: new mongoose.Types.ObjectId(restaurantId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  }

  async reports(restaurantId, range = {}) {
    const [overview, top, peak, turnover, status, rev] = await Promise.all([
      this.overview(restaurantId),
      this.popularItems(restaurantId),
      this.peakHours(restaurantId),
      this.tableTurnover(restaurantId),
      this.statusDistribution(restaurantId),
      this.revenue(restaurantId, range),
    ]);
    return { overview, top, peakHours: peak, turnover, status, revenue: rev };
  }

  async allRestaurants() {
    return this.restaurants.find({}, { sort: { createdAt: -1 } });
  }
}

export default new AdminService();