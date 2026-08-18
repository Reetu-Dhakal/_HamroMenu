import Subscription from '../models/Subscription.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import SubscriptionPlanFeatures from '../models/SubscriptionPlan.js'; // features map

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

    // 3. Check feature flag on plan
    const features = SubscriptionPlanFeatures[plan.name];
    if (!features) {
      return { allowed: false, reason: 'Plan features not defined' };
    }

    if (features[feature] === true) {
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
   * Check if restaurant can add another table (respects plan limits)
   */
  async canAddTable(restaurantId) {
    const subscription = await Subscription.findOne({ restaurant: restaurantId }).populate('plan');
    if (!subscription) return false;

    const plan = subscription.plan;
    if (!plan) return false;

    const limits = SubscriptionPlanFeatures[plan.name];
    if (!limits) return false;

    if (limits.maxTables === -1) return true; // unlimited
    // Actual table count queried at controller level; return true as placeholder
    return true;
  },

  /** 
   * Check if restaurant can add another menu item (respects plan limits)
   */
  async canAddMenuItem(restaurantId) {
    const subscription = await Subscription.findOne({ restaurant: restaurantId }).populate('plan');
    if (!subscription) return false;

    const plan = subscription.plan;
    if (!plan) return false;

    const limits = SubscriptionPlanFeatures[plan.name];
    if (!limits) return false;

    if (limits.maxMenuItems === -1) return true; // unlimited
    return true; // placeholder - actual count at controller level
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