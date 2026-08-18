import { model, Types } from 'mongoose';
import { SUBSCRIPTION_PLAN_NAMES, SUBSCRIPTION_PLAN_FEATURES } from './SubscriptionPlan.js';

const SubscriptionSchema = new mongoose.Schema(
  {
    restaurant: {
      type: Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      unique: true,
    },
    plan: {
      type: Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    status: {
      type: String,
      enum: ['TRIALING', 'ACTIVE', 'PAST_DUE', 'EXPIRED', 'CANCELLED'],
      default: 'TRIALING',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now,
    },
    currentPeriodEnd: {
      type: Date,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    cancelledAt: {
      type: Date,
    },
    // Billing
    pendingInvoice: {
      type: Types.ObjectId,
      ref: 'Invoice',
    },
  },
  { timestamps: true }
);

// Index for fast lookups
SubscriptionSchema.index({ restaurant: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ plan: 1 });

// Method: check if restaurant can add another table
SubscriptionSchema.methods.canAddTable = function () {
  if (!this.restaurant) return false;
  const plan = this.plan;
  if (!plan) return false;

  const planName = plan.name;
  const limits = SUBSCRIPTION_PLAN_FEATURES[planName];
  if (!limits) return false;

  if (limits.maxTables === -1) return true; // unlimited
  // will query Table count for this restaurant at controller level
  return true; // placeholder
};

// Method: check if restaurant can add another menu item
SubscriptionSchema.methods.canAddMenuItem = function () {
  if (!this.restaurant) return false;
  const plan = this.plan;
  if (!plan) return false;

  const planName = plan.name;
  const limits = SUBSCRIPTION_PLAN_FEATURES[planName];
  if (!limits) return false;

  if (limits.maxMenuItems === -1) return true; // unlimited
  // will query MenuItem count for this restaurant at controller level
  return true; // placeholder
};

// Method: check if restaurant has a specific feature enabled
SubscriptionSchema.methods.hasFeature = function (feature) {
  const plan = this.plan;
  if (!plan) return false;

  const features = SUBSCRIPTION_PLAN_FEATURES[plan.name];
  if (!features) return false;

  return features[feature] === true;
};

// Static: seed default plans into DB
SubscriptionSchema.statics.seedDefaultPlans = async function () {
  const existing = await this.countDocuments();
  if (existing > 0) return; // already seeded

  const plans = [];
  for (const [name, features] of Object.entries(SUBSCRIPTION_PLAN_FEATURES)) {
    const planName = name; // Free / Trial, Basic, Pro, Premium
    plans.push({
      name: planName,
      description: features.description,
      price: features.price,
      billingCycle: features.billingCycle || 'MONTHLY',
      featureFlags: new Map(Object.entries(features)),
      maxTables: features.maxTables,
      maxMenuItems: features.maxMenuItems,
      maxStaffAccounts: features.maxStaffAccounts,
      trialDays: features.trialDays,
      isActive: true,
    });
  }
  await this.insertMany(plans);
  console.log(` seeded ${plans.length} subscription plans`);
};

// Static: get plan by name
SubscriptionSchema.statics.getPlanByName = function (name) {
  return this.findOne({ name }).lean();
};

// Static: get all active plans with features
SubscriptionSchema.statics.getAllPlansWithFeatures = function () {
  return this.find({ isActive: true }).lean();
};

export default model('Subscription', SubscriptionSchema);