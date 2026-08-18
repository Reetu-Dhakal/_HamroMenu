import { Schema, model } from 'mongoose';

export const SUBSCRIPTION_PLAN_NAMES = {
  FREE: 'Free / Trial',
  BASIC: 'Basic',
  PRO: 'Pro',
  PREMIUM: 'Premium',
};

export const SUBSCRIPTION_PLAN_FEATURES = {
  [SUBSCRIPTION_PLAN_NAMES.FREE]: {
    price: 0,
    billingCycle: 'MONTHLY',
    hasRecommendations: false,
    hasApriori: false,
    hasCustomBranding: false,
    hasAdvancedReports: false,
    maxTables: 5,
    maxMenuItems: 20,
    maxStaffAccounts: 1,
    trialDays: 14,
    description: 'Free trial for up to 5 tables, 20 menu items, 1 staff account. HamroMenu branding shown.',
  },
  [SUBSCRIPTION_PLAN_NAMES.BASIC]: {
    price: 29,
    billingCycle: 'MONTHLY',
    hasRecommendations: false,
    hasApriori: false,
    hasCustomBranding: false,
    hasAdvancedReports: false,
    maxTables: 15,
    maxMenuItems: 100,
    maxStaffAccounts: 3,
    trialDays: null,
    description: 'Basic plan: up to 15 tables, 100 menu items, 3 staff accounts. Basic reports. No recommendations/apriori.',
  },
  [SUBSCRIPTION_PLAN_NAMES.PRO]: {
    price: 79,
    billingCycle: 'MONTHLY',
    hasRecommendations: true,
    hasApriori: true,
    hasCustomBranding: false,
    hasAdvancedReports: true,
    maxTables: -1, // unlimited
    maxMenuItems: -1, // unlimited
    maxStaffAccounts: -1, // unlimited
    trialDays: null,
    description: 'Pro plan: unlimited tables/items/staff. KNN recommendations + Apriori "frequently ordered together". Advanced analytics dashboard.',
  },
  [SUBSCRIPTION_PLAN_NAMES.PREMIUM]: {
    price: 199,
    billingCycle: 'MONTHLY',
    hasRecommendations: true,
    hasApriori: true,
    hasCustomBranding: true,
    hasAdvancedReports: true,
    maxTables: -1, // unlimited
    maxMenuItems: -1, // unlimited
    maxStaffAccounts: -1, // unlimited
    trialDays: null,
    description: 'Premium plan: everything in Pro + custom branding (remove HamroMenu badge), export reports, multiple staff roles, priority verification review.',
  },
};

const SubscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: Object.values(SUBSCRIPTION_PLAN_NAMES),
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    billingCycle: {
      type: String,
      enum: ['MONTHLY', 'YEARLY'],
      default: 'MONTHLY',
    },
    featureFlags: {
      type: Map,
      of: Boolean,
      default: () => new Map(),
    },
    // Derived from feature flags; stored for quick query
    maxTables: {
      type: Number,
      default: 5, // fallback
    },
    maxMenuItems: {
      type: Number,
      default: 20, // fallback
    },
    maxStaffAccounts: {
      type: Number,
      default: 1, // fallback
    },
    trialDays: {
      type: Number,
      default: 14,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Pre-populate max limits from feature flags on init
SubscriptionPlanSchema.pre('save', function (next) {
  const plans = {
    [SUBSCRIPTION_PLAN_NAMES.FREE]: { maxTables: 5, maxMenuItems: 20, maxStaffAccounts: 1, trialDays: 14 },
    [SUBSCRIPTION_PLAN_NAMES.BASIC]: { maxTables: 15, maxMenuItems: 100, maxStaffAccounts: 3, trialDays: null },
    [SUBSCRIPTION_PLAN_NAMES.PRO]: { maxTables: -1, maxMenuItems: -1, maxStaffAccounts: -1, trialDays: null },
    [SUBSCRIPTION_PLAN_NAMES.PREMIUM]: { maxTables: -1, maxMenuItems: -1, maxStaffAccounts: -1, trialDays: null },
  };

  const planKey = this.name;
  if (plans[planKey]) {
    const limits = plans[planKey];
    this.maxTables = limits.maxTables;
    this.maxMenuItems = limits.maxMenuItems;
    this.maxStaffAccounts = limits.maxStaffAccounts;
    this.trialDays = limits.trialDays;
  }
  next();
});

export default model('SubscriptionPlan', SubscriptionPlanSchema);