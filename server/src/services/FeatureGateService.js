import Subscription from '../models/Subscription.js';
import MenuItem from '../models/MenuItem.js';
import Table from '../models/Table.js';
import Staff from '../models/Staff.js';
import KitchenStaff from '../models/KitchenStaff.js';
import { SUBSCRIPTION_PLAN_FEATURES } from '../models/SubscriptionPlan.js';
import ApiError from '../utils/ApiError.js';

const FeatureGateService = {

  /** 
   * Check if restaurant's current plan allows a given feature.
   * Returns { allowed: boolean, reason?: string, plan?: object }
   */
  async checkFeature(restaurantId, feature) {
    // 1. super_admin bypasses all checks
    // 2. Find restaurant's active subscription
    const subscription = await Subscription.findOne({
      restaurant: restaurantId,
      status: { $ne: 'EXPIRED' },
    }).populate('plan');

    if (!subscription) {
      return { allowed: false, reason: 'No active subscription found' };
    }

    const plan = subscription.plan;
    if (!plan) {
      return { allowed: false, reason: 'Plan not found on subscription' };
    }

    // 3. Check feature flag on plan (accept snake_case + camelCase keys)
    const features = SUBSCRIPTION_PLAN_FEATURES[plan.name];
    if (!features) {
      return { allowed: false, reason: 'Plan features not defined' };
    }

    const FEATURE_ALIASES = {
      has_recommendations: 'hasRecommendations',
      has_apriori: 'hasApriori',
      has_custom_branding: 'hasCustomBranding',
      has_advanced_reports: 'hasAdvancedReports',
    };
    const canonical = FEATURE_ALIASES[feature] || feature;
    if (features[canonical] === true || features[feature] === true) {
      return { allowed: true, plan };
    }

    // 4. For features not in flag map, apply plan limit logic
    // e.g., max_tables, max_menu_items, max_staff_accounts
    if (feature.startsWith('max')) {
      const limitKey = feature.replace('max', '').charAt(0).toLowerCase() + feature.replace('max', '').slice(1);
      // This is a placeholder - actual limit checking done in controllers
      return { allowed: true, plan, reason: 'Limit check handled at controller level' };
    }

    return { allowed: false, reason: `Feature '${feature}' not available on ${plan.name} plan` };
  },

  /** 
   * Middleware: authorize based on plan features.
   * Usage: auth, ensureRestaurantContext, gateFeature('has_recommendations'), controller
   */
  gateFeature(feature) {
    return async (req, res, next) => {
      // super_admin bypasses
      if (req.user.role === 'super_admin') return next();

      // ensureRestaurantContext should have run before this
      if (!req.user.restaurant) {
        return next(new ApiError(403, 'User not associated with a restaurant'));
      }

      const result = await this.checkFeature(req.user.restaurant._id, feature);
      if (result.allowed) {
        return next();
      }

      return next(
        new ApiError(403, result.reason || `Feature not available on your ${result.plan?.name || 'current'} plan`)
      );
    };
  },

  /**
   * Backend-enforced resource limits. Counts current usage and compares
   * against the plan limit. `-1` means unlimited (existing convention).
   * Returns boolean for backward compat; use *Detail variants for messages.
   */
  async canAddTable(restaurantId) {
    const d = await this.tableUsageDetail(restaurantId);
    return d.allowed;
  },

  async canAddMenuItem(restaurantId) {
    const d = await this.menuItemUsageDetail(restaurantId);
    return d.allowed;
  },

  async canAddStaff(restaurantId) {
    const d = await this.staffUsageDetail(restaurantId);
    return d.allowed;
  },

  async tableUsageDetail(restaurantId) {
    const subscription = await Subscription.findOne({ restaurant: restaurantId }).populate('plan');
    if (!subscription) return { allowed: false, used: 0, max: 0, reason: 'No active subscription found' };
    const plan = subscription.plan;
    if (!plan) return { allowed: false, used: 0, max: 0, reason: 'Plan not found on subscription' };
    const limits = SUBSCRIPTION_PLAN_FEATURES[plan.name];
    if (!limits) return { allowed: false, used: 0, max: 0, reason: 'Plan features not defined' };
    if (limits.maxTables === -1) {
      const used = await Table.countDocuments({ restaurant: restaurantId, isActive: true });
      return { allowed: true, used, max: -1, plan: plan.name };
    }
    const used = await Table.countDocuments({ restaurant: restaurantId, isActive: true });
    if (used >= limits.maxTables) {
      return { allowed: false, used, max: limits.maxTables, plan: plan.name, reason: `Maximum ${limits.maxTables} tables reached on ${plan.name} plan. Upgrade for more.` };
    }
    return { allowed: true, used, max: limits.maxTables, plan: plan.name };
  },

  async menuItemUsageDetail(restaurantId) {
    const subscription = await Subscription.findOne({ restaurant: restaurantId }).populate('plan');
    if (!subscription) return { allowed: false, used: 0, max: 0, reason: 'No active subscription found' };
    const plan = subscription.plan;
    if (!plan) return { allowed: false, used: 0, max: 0, reason: 'Plan not found on subscription' };
    const limits = SUBSCRIPTION_PLAN_FEATURES[plan.name];
    if (!limits) return { allowed: false, used: 0, max: 0, reason: 'Plan features not defined' };
    const used = await MenuItem.countDocuments({ restaurant: restaurantId });
    if (limits.maxMenuItems === -1) return { allowed: true, used, max: -1, plan: plan.name };
    if (used >= limits.maxMenuItems) {
      return { allowed: false, used, max: limits.maxMenuItems, plan: plan.name, reason: `Maximum ${limits.maxMenuItems} menu items reached on ${plan.name} plan. Upgrade for more.` };
    }
    return { allowed: true, used, max: limits.maxMenuItems, plan: plan.name };
  },

  async staffUsageDetail(restaurantId) {
    const subscription = await Subscription.findOne({ restaurant: restaurantId }).populate('plan');
    if (!subscription) return { allowed: false, used: 0, max: 0, reason: 'No active subscription found' };
    const plan = subscription.plan;
    if (!plan) return { allowed: false, used: 0, max: 0, reason: 'Plan not found on subscription' };
    const limits = SUBSCRIPTION_PLAN_FEATURES[plan.name];
    if (!limits) return { allowed: false, used: 0, max: 0, reason: 'Plan features not defined' };
    const [staffCount, kitchenCount] = await Promise.all([
      Staff.countDocuments({ restaurant: restaurantId }),
      KitchenStaff.countDocuments({ restaurant: restaurantId }),
    ]);
    const used = staffCount + kitchenCount;
    if (limits.maxStaffAccounts === -1) return { allowed: true, used, max: -1, plan: plan.name };
    if (used >= limits.maxStaffAccounts) {
      return { allowed: false, used, max: limits.maxStaffAccounts, plan: plan.name, reason: `Maximum ${limits.maxStaffAccounts} staff accounts reached on ${plan.name} plan. Upgrade for more.` };
    }
    return { allowed: true, used, max: limits.maxStaffAccounts, plan: plan.name };
  },

  /** 
   * Check if restaurant's plan includes KNN recommendations
   */
  async hasRecommendations(restaurantId) {
    const result = await this.checkFeature(restaurantId, 'has_recommendations');
    return result.allowed;
  },

  /** 
   * Check if restaurant's plan includes Apriori "frequently ordered together"
   */
  async hasApriori(restaurantId) {
    const result = await this.checkFeature(restaurantId, 'has_apriori');
    return result.allowed;
  },
};

export default FeatureGateService;