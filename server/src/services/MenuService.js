import menuRepository from '../repositories/MenuRepository.js';
import restaurantRepository from '../repositories/RestaurantRepository.js';
import Subscription from '../models/Subscription.js';
import FeatureGateService from '../services/FeatureGateService.js';
import Coupon from '../models/Coupon.js';
import ApiError, { ErrorCodes } from '../utils/ApiError.js';

const DEFAULT_IMAGE = 'https://res.cloudinary.com/demo/image/upload/w_600,h_400,c_fill,q_auto,f_auto/demo/food_plate.jpg';

class MenuService {
  constructor() {
    this.repo = menuRepository;
    this.restaurants = restaurantRepository;
  }

  async getRestaurant(slugOrId) {
    let restaurant;
    if (slugOrId.length >= 24) restaurant = await this.restaurants.findById(slugOrId);
    else restaurant = await this.restaurants.findBySlug(slugOrId);
    if (!restaurant) throw new ApiError(404, 'Restaurant not found', null, ErrorCodes.NOT_FOUND);
    return restaurant;
  }

  async getMenuPlanAware(
    restaurantId,
    { search = '', includeInactive = false, vegOnly = false, spice = '', maxPrice = 0, tag = '' } = {},
    planName
  ) {
    // 1. Check if restaurant can view unlimited items or has limits
    const subscription = await Subscription.findOne({ restaurant: restaurantId }).populate('plan');
    let limits = { maxMenuItems: -1 }; // unlimited by default

    if (subscription && subscription.plan) {
      const planDisplayName = subscription.plan.name;
      limits = SubscriptionPlanFeatures[planDisplayName] || { maxMenuItems: -1 };
    }

    // 2. Get full menu
    let { items, categories } = await this.getMenu(restaurantId, {
      search, includeInactive, vegOnly, spice, maxPrice, tag,
    });

    // 3. Apply plan limit: hide excess items beyond maxMenuItems
    if (limits.maxMenuItems !== -1 && limits.maxMenuItems > 0) {
      const currentCount = items.length;
      if (currentCount > limits.maxMenuItems) {
        // Keep only the first maxMenuItems items; rest become inactive/hidden
        items = items.slice(0, limits.maxMenuItems);
      }
    }

    return { items, categories, restaurantId, planLimits: limits };
  }

  async getMenu(
    restaurantId,
    { search = '', includeInactive = false, vegOnly = false, spice = '', maxPrice = 0, tag = '' } = {}
  ) {
    let { items, categories } = await this.repo.listWithCategory(restaurantId, { includeInactive });
    if (search) {
      items = await this.repo.search(restaurantId, search);
    }
    if (vegOnly) items = items.filter((it) => it.isVeg);
    if (spice) items = items.filter((it) => it.spiceLevel === spice);
    if (Number(maxPrice) > 0) items = items.filter((it) => it.effectivePrice() <= Number(maxPrice));
    if (tag) items = items.filter((it) => (it.tags || []).some((t) => t.toLowerCase() === tag.toLowerCase()));
    return { items, categories, restaurantId };
  }

  async getCategories(restaurantId) {
    return this.repo.categories.find({ restaurant: restaurantId }, { sort: { displayOrder: 1 } });
  }

  async createCategory(restaurantId, data) {
    return this.repo.categories.create({ restaurant: restaurantId, ...data });
  }

  async updateCategory(id, update) {
    return this.repo.categories.findByIdAndUpdate(id, update);
  }

  async deleteCategory(id) {
    await this.repo.updateMany({ category: id }, { $unset: { category: '' } }, { runValidators: false });
    return this.repo.categories.findByIdAndDelete(id);
  }

  async createItem(restaurantId, data) {
    if (!data.category) throw new ApiError(400, 'Category is required');
    return this.repo.create({ restaurant: restaurantId, imageUrl: DEFAULT_IMAGE, ...data });
  }

  async updateItem(id, update, imageInfo = null) {
    if (imageInfo) {
      update.imageUrl = imageInfo.url;
      update.imagePublicId = imageInfo.publicId;
    }
    return this.repo.findByIdAndUpdate(id, update);
  }

  async deleteItem(id) {
    return this.repo.findByIdAndDelete(id);
  }

  async toggleAvailability(id, isAvailable) {
    return this.repo.findByIdAndUpdate(id, { isAvailable });
  }

  async populateNames(items) {
    const ids = [...new Set(items.map((it) => it.menuItem))];
    const menuItems = await this.repo.find({ _id: { $in: ids } });
    const map = new Map(menuItems.map((m) => [m._id.toString(), m]));
    return items.map((it) => {
      const m = map.get(it.menuItem.toString());
      return { ...it, menu: m || null };
    });
  }

  async validateCoupon(restaurantId, code, subtotal, customerId) {
    const coupon = await Coupon.findOne({
      restaurant: restaurantId,
      code: code.toUpperCase(),
    });
    if (!coupon) throw new ApiError(404, 'Coupon not found', null, ErrorCodes.INVALID_COUPON);
    const [totalUsage, userUsage] = await Promise.all([
      coupon.usedCount,
      this.countCouponUserUsage(coupon._id, customerId),
    ]);
    const check = coupon.isUsable(subtotal, totalUsage, userUsage);
    if (!check.ok) throw new ApiError(400, check.message, null, ErrorCodes.INVALID_COUPON);
    return coupon;
  }

  async countCouponUserUsage(couponId, customerId) {
    const Order = (await import('../models/Order.js')).default;
    return Order.countDocuments({ coupon: couponId, customer: customerId, status: { $nin: ['cancelled'] } });
  }

  async markCouponUsed(couponId) {
    await Coupon.updateOne({ _id: couponId }, { $inc: { usedCount: 1 } });
  }

  async coupons(restaurantId) {
    return Coupon.find({ restaurant: restaurantId }).sort({ createdAt: -1 });
  }

  async createCoupon(restaurantId, data) {
    return Coupon.create({ restaurant: restaurantId, code: (data.code || '').toUpperCase(), ...data });
  }

  async updateCoupon(id, update) {
    return Coupon.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  }

  async deleteCoupon(id) {
    return Coupon.findByIdAndDelete(id);
  }
}

export default new MenuService();