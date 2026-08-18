import Restaurant from '../models/Restaurant.js';
import Subscription from '../models/Subscription.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Invoice from '../models/Invoice.js';

class SuperAdminController {
  async overview(req, res, next) {
    asyncHandler(async () => {
      const [
        totalRestaurants,
        activeRestaurants,
        pendingApplications,
        totalOrders,
        pendingOrders,
      ] = await Promise.all([
        Restaurant.countDocuments({ restaurantStatus: 'ACTIVE' }),
        Restaurant.countDocuments({ restaurantStatus: 'ACTIVE' }),
        Restaurant.countDocuments({ verificationStatus: 'PENDING' }),
        Order.countDocuments({ status: { $ne: 'cancelled' } }),
        Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] } }),
      ]);
      const stats = {
        totalRestaurants,
        activeRestaurants,
        pendingApplications,
        totalOrders,
        pendingOrders,
      };
      return ApiResponse.send(res, 200, stats, 'Overview retrieved');
    })(req, res, next);
  }

  async applications(req, res, next) {
    asyncHandler(async () => {
      const restaurants = await req.app.get('restaurantModel').find({
        verificationStatus: 'PENDING',
        restaurantStatus: 'PENDING',
      }).select('name address businessRegistrationNumber owner verificationChecks verificationNote createdAt');
      return ApiResponse.send(res, 200, restaurants, 'Pending applications retrieved');
    })(req, res, next);
  }

  async applicationDetail(req, res, next) {
    asyncHandler(async () => {
      const { id } = req.params;
      const restaurant = await req.app.get('restaurantModel').findById(id).select('name address contact businessRegistrationNumber panNumber documents verificationStatus restaurantStatus verificationChecks verificationNote owner verifiedAt approvedAt rejectedAt');
      if (!restaurant) throw new ApiError(404, 'Restaurant application not found');
      return ApiResponse.send(res, 200, restaurant, 'Application detail retrieved');
    })(req, res, next);
  }

  async approveApplication(req, res, next) {
    asyncHandler(async () => {
      const { id } = req.params;
      const restaurant = await req.app.get('restaurantModel').findByIdAndUpdate(
        id,
        { verificationStatus: 'VERIFIED', restaurantStatus: 'APPROVED', verifiedAt: new Date() },
        { new: true }
      );
      if (!restaurant) throw new ApiError(404, 'Restaurant application not found');
      return ApiResponse.send(res, 200, restaurant, 'Restaurant application approved');
    })(req, res, next);
  }

  async rejectApplication(req, res, next) {
    asyncHandler(async () => {
      const { id } = req.params;
      const { reason } = req.body;
      if (!reason) throw new ApiError(400, 'Rejection reason is required');
      const restaurant = await req.app.get('restaurantModel').findByIdAndUpdate(
        id,
        { verificationStatus: 'REJECTED', restaurantStatus: 'REJECTED', rejectedAt: new Date(), verificationNote: reason },
        { new: true }
      );
      if (!restaurant) throw new ApiError(404, 'Restaurant application not found');
      return ApiResponse.send(res, 200, restaurant, 'Restaurant application rejected');
    })(req, res, next);
  }

  async requestCorrection(req, res, next) {
    asyncHandler(async () => {
      const { id } = req.params;
      const { reason } = req.body;
      if (!reason) throw new ApiError(400, 'Request reason is required');
      const restaurant = await req.app.get('restaurantModel').findByIdAndUpdate(
        id, { verificationStatus: 'MANUAL_REVIEW', verificationNote: reason }, { new: true }
      );
      if (!restaurant) throw new ApiError(404, 'Restaurant application not found');
      return ApiResponse.send(res, 200, restaurant, 'Correction requested');
    })(req, res, next);
  }

  async subscriptions(req, res, next) {
    asyncHandler(async () => {
      const restaurants = await Restaurant.find()
        .select('name slug verificationStatus restaurantStatus')
        .populate({
          path: 'subscription',
          select: 'status plan currentPeriodStart currentPeriodEnd autoRenew',
          populate: {
            path: 'plan',
            select: 'name price billingCycle hasRecommendations hasApriori hasCustomBranding hasAdvancedReports maxTables maxMenuItems maxStaffAccounts',
          },
        });
      const formatted = restaurants.map((r) => ({
        id: r._id,
        name: r.name,
        slug: r.slug,
        verificationStatus: r.verificationStatus,
        restaurantStatus: r.restaurantStatus,
        subscription: r.subscription ? {
          status: r.subscription.status,
          plan: r.subscription.plan?.name,
          planPrice: r.subscription.plan?.price,
          billingCycle: r.subscription.plan?.billingCycle,
          hasRecommendations: r.subscription.plan?.featureFlags?.hasRecommendations,
          hasApriori: r.subscription.plan?.featureFlags?.hasApriori,
          maxTables: r.subscription.plan?.maxTables,
          maxMenuItems: r.subscription.plan?.maxMenuItems,
          isAutoRenew: r.subscription.autoRenew,
          currentPeriodStart: r.subscription.currentPeriodStart,
          currentPeriodEnd: r.subscription.currentPeriodEnd,
        } : null,
      }));
      return ApiResponse.send(res, 200, formatted, 'Subscriptions retrieved');
    })(req, res, next);
  }

  async revenueOverview(req, res, next) {
    asyncHandler(async () => {
      const totalRevenue = await Invoice.aggregate([
        { $match: { status: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const byStatus = await Invoice.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      ]);
      const byPlan = await Subscription.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 }, statuses: { $push: '$status' } } },
        { $lookup: { from: 'subscriptionplans', localField: '_id', foreignField: '_id', as: 'plan' } },
        { $unwind: '$plan' },
      ]);
      return ApiResponse.send(res, 200, {
        totalRevenue: totalRevenue[0]?.total || 0,
        byStatus,
        byPlan,
      }, 'Revenue overview retrieved');
    })(req, res, next);
  }

  async restaurantReports(req, res, next) {
    asyncHandler(async () => {
      const { restaurantId } = req.params;
      const { range = '30d' } = req.query;
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) throw new ApiError(404, 'Restaurant not found');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (range === '30d' ? 30 : range === '90d' ? 90 : 7));
      startDate.setHours(0, 0, 0, 0);
      const [totalOrders, revenueByStatus, topItems, hourlyStats] = await Promise.all([
        Order.countDocuments({ restaurant: restaurantId, createdAt: { $gte: startDate } }),
        Order.aggregate([{ $match: { restaurant: restaurantId, createdAt: { $gte: startDate } } }, { $group: { _id: '$paymentStatus', count: { $sum: 1 }, total: { $sum: '$grandTotal' } } } ]),
        Order.aggregate([{ $match: { restaurant: restaurantId, createdAt: { $gte: startDate }, 'items.menuItem': { $exists: true } } }, { $unwind: '$items' }, { $group: { menuItem: '$items.menuItem', orderCount: { $sum: 1 }, totalRevenue: { $sum: '$items.lineTotal' } } }, { $sort: { orderCount: -1 } }, { $limit: 5 } ]),
        Order.aggregate([{ $match: { restaurant: restaurantId, createdAt: { $gte: startDate } } }, { $group: { hour: { $hour: '$createdAt' }, count: { $sum: 1 } } }, { $sort: { hour: 1 } } ])
      ]);
      return ApiResponse.send(res, 200, {
        restaurantId, restaurantName: restaurant.name, range, totalOrders, revenueByStatus, topItems, hourlyStats,
      }, 'Restaurant reports retrieved');
    })(req, res, next);
  }

  async subscriptionsByPlan(req, res, next) {
    asyncHandler(async () => {
      const { restaurantId } = req.params;
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) throw new ApiError(404, 'Restaurant not found');
      const subscription = await Subscription.findOne({ restaurant: restaurantId }).populate('plan');
      if (!subscription) return ApiResponse.send(res, 200, { plan: null, status: null }, 'No subscription');
      return ApiResponse.send(res, 200, {
        plan: subscription.plan.name, status: subscription.status, startDate: subscription.startedAt, endDate: subscription.currentPeriodEnd, autoRenew: subscription.autoRenew, featureFlags: subscription.plan?.featureFlags, limits: { maxTables: subscription.plan?.maxTables, maxMenuItems: subscription.plan?.maxMenuItems, maxStaffAccounts: subscription.plan?.maxStaffAccounts },
      }, 'Subscription details retrieved');
    })(req, res, next);
  }
}

export default new SuperAdminController();