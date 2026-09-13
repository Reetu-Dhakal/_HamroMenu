import restaurantRepository from '../repositories/RestaurantRepository.js';
import menuService from '../services/MenuService.js';
import qrService from '../services/QRService.js';
import CloudinaryService from '../services/CloudinaryService.js';
import Subscription from '../models/Subscription.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Invoice from '../models/Invoice.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';

function toPublicRestaurant(doc) {
  if (!doc) return doc;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  delete o.businessRegistrationNumber;
  delete o.panNumber;
  delete o.documents;
  delete o.verificationChecks;
  delete o.verificationNote;
  delete o.owner;
  delete o.verifiedAt;
  delete o.approvedAt;
  delete o.rejectedAt;
  delete o.suspendedAt;
  return o;
}

class RestaurantController {
  async getBySlug(req, res, next) {
    asyncHandler(async () => {
      const restaurant = await menuService.getRestaurant(req.params.slug);
      return ApiResponse.send(res, 200, toPublicRestaurant(restaurant));
    })(req, res, next);
  }

  async getById(req, res, next) {
    asyncHandler(async () => {
      const restaurant = await menuService.getRestaurant(req.params.restaurantId);
      return ApiResponse.send(res, 200, toPublicRestaurant(restaurant));
    })(req, res, next);
  }

  async tables(req, res, next) {
    asyncHandler(async () => {
      const tables = await restaurantRepository.tablesFor(req.params.restaurantId);
      return ApiResponse.send(res, 200, tables);
    })(req, res, next);
  }

  async tableByNumber(req, res, next) {
    asyncHandler(async () => {
      const restaurant = await restaurantRepository.findById(req.params.restaurantId);
      if (!restaurant) throw new ApiError(404, 'Restaurant not found');
      const table = await restaurantRepository.tableByNumber(restaurant._id, Number(req.params.number));
      if (!table || !table.isActive) throw new ApiError(404, 'Table not found', null, 'TABLE_NOT_FOUND');
      return ApiResponse.send(res, 200, { restaurant: toPublicRestaurant(restaurant), table });
    })(req, res, next);
  }

  async scanQR(req, res, next) {
    asyncHandler(async () => {
      const result = await qrService.scan(req.body.payload);
      return ApiResponse.send(res, 200, result, 'QR verified');
    })(req, res, next);
  }

  async qrForTable(req, res, next) {
    asyncHandler(async () => {
      const restaurant = await restaurantRepository.findById(req.params.restaurantId);
      if (!restaurant) throw new ApiError(404, 'Restaurant not found');
      const table = await restaurantRepository.tableById(req.params.tableId);
      if (!table || table.restaurant.toString() !== restaurant._id.toString()) throw new ApiError(404, 'Table not found');

      let qr = await restaurantRepository.qrByTable(restaurant._id, table._id);
      if (!qr || !qr.dataUrl) {
        qr = await qrService.generateQRCode(restaurant, table, { persist: true });
      }
      return ApiResponse.send(res, 200, qr);
    })(req, res, next);
  }

async regenerateQR(req, res, next) {
    asyncHandler(async () => {
      const restaurant = await restaurantRepository.findById(req.params.restaurantId);
      if (!restaurant) throw new ApiError(404, 'Restaurant not found');
      const table = await restaurantRepository.tableById(req.params.tableId);
      if (!table || table.restaurant.toString() !== restaurant._id.toString()) throw new ApiError(404, 'Table not found');
      const qr = await qrService.regenerateForTable(restaurant, table);
      return ApiResponse.send(res, 200, qr, 'QR regenerated');
    })(req, res, next);
  }

  async canAddTable(restaurantId) {
    const FeatureGateService = (await import('../services/FeatureGateService.js')).default;
    const usage = await FeatureGateService.tableUsageDetail(restaurantId);
    return { allowed: usage.allowed, reason: usage.reason };
  }

  async addTable(req, res, next) {
    asyncHandler(async () => {
      const restaurantId = req.params.restaurantId;
      const canAdd = await this.canAddTable(restaurantId);
      if (!canAdd.allowed) {
        return next(
          new ApiError(403, canAdd.reason || 'Cannot add table - plan limit reached')
        );
      }

      const table = await restaurantRepository.createTable(restaurantId, {
        label: req.body.label || `Table ${String(await restaurantRepository.tablesFor(restaurantId).length + 1).padStart(2, '0')}`,
        capacity: req.body.capacity || 4,
      });

      // Generate QR code for the new table
      const qr = await qrService.generateQRCode(restaurantId, table, { persist: true });

      return ApiResponse.send(res, 201, { table, qr }, 'Table and QR code added');
    })(req, res, next);
  }

  async listRestaurants(req, res, next) {
    asyncHandler(async () => {
      const restaurants = await restaurantRepository.find({}, { timestamps: false });
      return ApiResponse.send(res, 200, restaurants);
    })(req, res, next);
  }

  async registerRestaurant(req, res, next) {
    asyncHandler(async () => {
      const { name, slug, description, tagline, cuisine, address, contact, logoUrl, coverUrl,
        currency, taxRate, serviceChargeRate, isOpen, operatingHours,
        planName } = req.body;

      // Validate plan exists
      const plan = await SubscriptionPlan.findOne({ name: planName, isActive: true });
      if (!plan) throw new ApiError(400, 'Invalid or inactive subscription plan');

      // Create restaurant
      const restaurant = await restaurantRepository.create({
        name, slug, description, tagline, cuisine, address, contact,
        logoUrl, coverUrl, currency, taxRate, serviceChargeRate, isOpen,
        operatingHours,
      });

      // Create Free/Trial or selected plan subscription
      const subscription = new Subscription({
        restaurant: restaurant._id,
        plan: plan._id,
        status: plan.name === 'Free / Trial' ? 'TRIALING' : 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: plan.name === 'Free / Trial'
          ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          : null, // paid plans: set period end based on billing cycle
        autoRenew: plan.name !== 'Free / Trial',
      });
      await subscription.save();

      // Create initial invoice
      await new Invoice({
        restaurant: restaurant._id,
        subscription: subscription._id,
        amount: plan.price,
        billingPeriodStart: new Date(),
        billingPeriodEnd: plan.name === 'Free / Trial'
          ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          : null,
        status: 'PENDING',
        paymentMethod: 'pay_after_meal',
      }).save();

      // Generate QR codes for default tables if operatingHours provided
      if (operatingHours && operatingHours.length > 0) {
        for (const oh of operatingHours) {
          const table = await restaurantRepository.createTable(restaurant._id, {
            label: `Table ${String(restaurant.tables?.length + 1).padStart(2, '0')}`,
            capacity: 4,
          });
          await qrService.generateQRCode(restaurant, table, { persist: true });
        }
      }

      return ApiResponse.send(res, 201, { restaurant, subscription, plan }, 'Restaurant registered with subscription');
    })(req, res, next);
  }

  async verifyRestaurant(req, res, next) {
    asyncHandler(async () => {
      const restaurant = await restaurantRepository.findById(req.params.restaurantId);
      if (!restaurant) throw new ApiError(404, 'Restaurant not found');

      restaurant.verificationStatus = 'VERIFIED';
      restaurant.verifiedAt = new Date();
      await restaurant.save();

      // Upgrade from TRIALING to ACTIVE if was on trial
      const sub = await Subscription.findOne({ restaurant: restaurant._id });
      if (sub && sub.status === 'TRIALING') {
        sub.status = 'ACTIVE';
        sub.currentPeriodEnd = null; // paid plan, no trial end
        await sub.save();
      }

      return ApiResponse.send(res, 200, { restaurant, sub }, 'Restaurant verified and activated');
    })(req, res, next);
  }

  async updateRestaurantStatus(req, res, next) {
    asyncHandler(async () => {
      const restaurant = await restaurantRepository.findById(req.params.restaurantId);
      if (!restaurant) throw new ApiError(404, 'Restaurant not found');

      restaurant.restaurantStatus = req.body.status;
      await restaurant.save();
      return ApiResponse.send(res, 200, { restaurant }, 'Restaurant status updated');
    })(req, res, next);
  }

  async uploadImage(req, res, next) {
    asyncHandler(async () => {
      if (!req.file) throw new ApiError(400, 'No file uploaded');
      const result = await CloudinaryService.uploadFile(req.file, { folder: `hamromenu/${req.body.folder || 'general'}` });
      return ApiResponse.send(res, 200, result, 'Image uploaded');
    })(req, res, next);
  }

  /**
   * Public restaurant discovery (no auth).
   * Returns only approved/active, verified restaurants.
   * Supports: search, cuisine, city, sort, pagination.
   * Never exposes passwords, subscriptions, or private management fields.
   */
  async discover(req, res, next) {
    asyncHandler(async () => {
      const { search = '', cuisine = '', city = '', sort = 'name', page = 1, limit = 12 } = req.query;
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
      const filter = {
        isActive: true,
        restaurantStatus: { $in: ['ACTIVE', 'APPROVED'] },
      };
      if (search) {
        const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [{ name: rx }, { description: rx }, { tagline: rx }, { cuisine: rx }];
      }
      if (cuisine) filter.cuisine = { $in: [new RegExp(`^${cuisine.trim()}$`, 'i')] };
      if (city) filter['address.city'] = new RegExp(`^${city.trim()}$`, 'i');

      const sortMap = { name: { name: 1 }, newest: { createdAt: -1 }, rating: { name: 1 } };
      const sortOpt = sortMap[sort] || { name: 1 };
      const skip = (pageNum - 1) * limitNum;
      const Restaurant = (await import('../models/Restaurant.js')).default;
      const [docs, total] = await Promise.all([
        Restaurant.find(filter)
          .select('name slug description tagline cuisine address contact logoUrl coverUrl isOpen operatingHours createdAt')
          .sort(sortOpt).skip(skip).limit(limitNum).lean(),
        Restaurant.countDocuments(filter),
      ]);
      return ApiResponse.send(res, 200, {
        restaurants: docs,
        pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) || 1 },
      }, 'Restaurants retrieved');
    })(req, res, next);
  }

  /**
   * Weighted restaurant ranking.
   * score = 0.5 * normalizedRating + 0.3 * orderPopularity + 0.2 * reviewEngagement
   * All components normalized to 0..1 across the candidate set.
   */
  async ranked(req, res, next) {
    asyncHandler(async () => {
      const { limit = 10 } = req.query;
      const lim = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
      const Restaurant = (await import('../models/Restaurant.js')).default;
      const Review = (await import('../models/Review.js')).default;
      const Order = (await import('../models/Order.js')).default;
      const restaurants = await Restaurant.find({
        isActive: true, restaurantStatus: { $in: ['ACTIVE', 'APPROVED'] },
      }).select('name slug cuisine address logoUrl coverUrl').limit(100).lean();
      if (!restaurants.length) return ApiResponse.send(res, 200, { restaurants: [] }, 'Ranked restaurants');
      const ids = restaurants.map((r) => r._id);
      const [ratingAgg, orderAgg, reviewAgg] = await Promise.all([
        Review.aggregate([{ $match: { restaurant: { $in: ids }, isApproved: true } }, { $group: { _id: '$restaurant', avgRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } }]),
        Order.aggregate([{ $match: { restaurant: { $in: ids }, status: { $nin: ['cancelled'] } } }, { $group: { _id: '$restaurant', orderCount: { $sum: 1 } } }]),
        Review.aggregate([{ $match: { restaurant: { $in: ids } } }, { $group: { _id: '$restaurant', totalReviews: { $sum: 1 } } }]),
      ]);
      const ratingMap = new Map(ratingAgg.map((r) => [String(r._id), r]));
      const orderMap = new Map(orderAgg.map((r) => [String(r._id), r.orderCount]));
      const reviewMap = new Map(reviewAgg.map((r) => [String(r._id), r.totalReviews]));
      const maxOrders = Math.max(1, ...orderMap.values(), 1);
      const maxReviews = Math.max(1, ...reviewMap.values(), 1);
      const scored = restaurants.map((r) => {
        const key = String(r._id);
        const avg = ratingMap.get(key)?.avgRating || 0;
        const normRating = avg / 5;
        const normOrders = (orderMap.get(key) || 0) / maxOrders;
        const normReviews = (reviewMap.get(key) || 0) / maxReviews;
        const score = Math.round((0.5 * normRating + 0.3 * normOrders + 0.2 * normReviews) * 100) / 100;
        return { ...r, avgRating: Math.round(avg * 10) / 10, orderCount: orderMap.get(key) || 0, reviewCount: reviewMap.get(key) || 0, rankScore: score };
      });
      scored.sort((a, b) => b.rankScore - a.rankScore);
      return ApiResponse.send(res, 200, { restaurants: scored.slice(0, lim) }, 'Ranked restaurants');
    })(req, res, next);
  }

  /** Safe table deletion: blocks when active orders reference the table. */
  async deleteTable(req, res, next) {
    asyncHandler(async () => {
      const { restaurantId, tableId } = req.params;
      const table = await restaurantRepository.tableById(tableId);
      if (!table || table.restaurant.toString() !== String(restaurantId)) {
        throw new ApiError(404, 'Table not found');
      }
      const Order = (await import('../models/Order.js')).default;
      const active = await Order.countDocuments({
        table: tableId,
        status: { $nin: ['completed', 'cancelled'] },
      });
      if (active > 0) {
        // Safe deactivation instead of hard delete to preserve history
        table.isActive = false;
        await table.save();
        return ApiResponse.send(res, 200, table, 'Table has active orders - deactivated instead of deleted');
      }
      await restaurantRepository.deleteTable(tableId);
      // Remove dangling QR reference (QR docs kept for audit, deactivated)
      const QRCode = (await import('../models/QRCode.js')).default;
      await QRCode.updateMany({ table: tableId }, { $set: { isActive: false } });
      return ApiResponse.send(res, 200, null, 'Table deleted');
    })(req, res, next);
  }
}

export default new RestaurantController();