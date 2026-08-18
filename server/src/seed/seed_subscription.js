import './config/mongoose.js'; // assuming mongoose connection setup
import SubscriptionPlan from './server/src/models/SubscriptionPlan.js';
import Subscription from './server/src/models/Subscription.js';
import Invoice from './server/src/models/Invoice.js';

const importData = async () => {
  try {
    // 1. Seed 4 subscription plans
    await SubscriptionPlan.deleteMany({});
    await SubscriptionPlan.insertMany([
      {
        name: 'Free / Trial',
        description: 'Free trial for up to 5 tables, 20 menu items, 1 staff account. HamroMenu branding shown.',
        price: 0,
        billingCycle: 'MONTHLY',
        maxTables: 5,
        maxMenuItems: 20,
        maxStaffAccounts: 1,
        trialDays: 14,
        isActive: true,
        featureFlags: new Map([
          ['hasRecommendations', false],
          ['hasApriori', false],
          ['hasCustomBranding', false],
          ['hasAdvancedReports', false],
        ]),
      },
      {
        name: 'Basic',
        description: 'Basic plan: up to 15 tables, 100 menu items, 3 staff accounts. Basic reports. No recommendations/apriori.',
        price: 29,
        billingCycle: 'MONTHLY',
        maxTables: 15,
        maxMenuItems: 100,
        maxStaffAccounts: 3,
        trialDays: null,
        isActive: true,
        featureFlags: new Map([
          ['hasRecommendations', false],
          ['hasApriori', false],
          ['hasCustomBranding', false],
          ['hasAdvancedReports', false],
        ]),
      },
      {
        name: 'Pro',
        description: 'Pro plan: unlimited tables/items/staff. KNN recommendations + Apriori "frequently ordered together". Advanced analytics dashboard.',
        price: 79,
        billingCycle: 'MONTHLY',
        maxTables: -1,
        maxMenuItems: -1,
        maxStaffAccounts: -1,
        trialDays: null,
        isActive: true,
        featureFlags: new Map([
          ['hasRecommendations', true],
          ['hasApriori', true],
          ['hasCustomBranding', false],
          ['hasAdvancedReports', true],
        ]),
      },
      {
        name: 'Premium',
        description: 'Premium plan: everything in Pro + custom branding (remove HamroMenu badge), export reports, multiple staff roles, priority verification review.',
        price: 199,
        billingCycle: 'MONTHLY',
        maxTables: -1,
        maxMenuItems: -1,
        maxStaffAccounts: -1,
        trialDays: null,
        isActive: true,
        featureFlags: new Map([
          ['hasRecommendations', true],
          ['hasApriori', true],
          ['hasCustomBranding', true],
          ['hasAdvancedReports', true],
        ]),
      },
    ]);

    console.log('✅ Subscription plans seeded');

    // 2. Initialize Subscription records for all existing restaurants
    const restaurants = await globalThis.mongoose.models.Restaurant.find({});
    console.log(`Found ${restaurants.length} restaurants`);

    for (const restaurant of restaurants) {
      // Check if restaurant already has a subscription
      const existingSub = await Subscription.findOne({ restaurant: restaurant._id });
      if (existingSub) continue;

      // Default to Free/Trial plan
      const freePlan = await SubscriptionPlan.findOne({ name: 'Free / Trial' });
      if (!freePlan) {
        console.error('Free/Trial plan not found!');
        continue;
      }

      const subscription = new Subscription({
        restaurant: restaurant._id,
        plan: freePlan._id,
        status: 'TRIALING',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        autoRenew: true,
      });
      await subscription.save();
      console.log(`✅ Subscription TRIALING for restaurant: ${restaurant.name}`);
    }

    // 3. Create initial invoices for trial restaurants
    const trialRestaurants = await Restaurant.find({
      'verificationStatus': 'VERIFIED',
      'restaurantStatus': 'ACTIVE',
    }).limit(20); // limit for demo

    for (const restaurant of trialRestaurants) {
      const sub = await Subscription.findOne({ restaurant: restaurant._id });
      if (!sub || sub.status !== 'TRIALING') continue;

      // Create a PENDING invoice for the trial period
      const invoice = new Invoice({
        restaurant: restaurant._id,
        subscription: sub._id,
        amount: 0, // free trial
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        paymentMethod: 'pay_after_meal',
      });
      await invoice.save();
    }

    console.log('✅ Initial subscriptions and invoices created');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

importData();