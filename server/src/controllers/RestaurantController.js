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

class RestaurantController {
  async getBySlug(req, res, next) {
    asyncHandler(async () => {
      const restaurant = await menuService.getRestaurant(req.params.slug);
      return ApiResponse.send(res, 200, restaurant);
    })(req, res, next);
  }

  async getById(req, res, next) {
    asyncHandler(async () => {
      const restaurant = await menuService.getRestaurant(req.params.restaurantId);
      return ApiResponse.send(res, 200, restaurant);
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
      return ApiResponse.send(res, 200, { restaurant, table });
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
      if (!table) throw new ApiError(404, 'Table not found');

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
      const table = await restaurantRepository.tableById(req.params.tableId);
      const qr = await qrService.regenerateForTable(restaurant, table);
      return ApiResponse.send(res, 200, qr, 'QR regenerated');
    })(req, res, next);
  }

  async canAddTable(restaurantId) {
    const subscription = await Subscription.findOne({ restaurant: restaurantId }).populate('plan');
    if (!subscription) return { allowed: false, reason: 'No subscription found' };

    const plan = subscription.plan;
    if (!plan) return { allowed: false, reason: 'No plan on subscription' };

    const limits = {
      'Free / Trial': { maxTables: 5 },
      Basic: { maxTables: 15 },
      Pro: { maxTables: -1 },
      Premium: { maxTables: -1 },
    };

    const planLimits = limits[plan.name] || { maxTables: -1 };
    if (planLimits.maxTables === -1) return { allowed: true };

    // Count current tables
    const currentTables = await restaurantRepository.tablesFor(restaurantId);
    if (currentTables.length >= planLimits.maxTables) {
      return {
        allowed: false,
        reason: `Maximum ${planLimits.maxTables} tables reached on ${plan.name} plan. Upgrade for more.`,
      };
    }
    return { allowed: true };
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
}

export default new RestaurantController();