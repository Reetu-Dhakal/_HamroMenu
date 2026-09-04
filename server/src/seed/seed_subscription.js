import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Subscription from '../models/Subscription.js';
import Invoice from '../models/Invoice.js';
import Restaurant from '../models/Restaurant.js';

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hamromenu');
    console.log('MongoDB connected');

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
        description: 'Basic plan: up to 15 tables, 100 menu items, 3 staff accounts. Basic reports.',
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
        description: 'Pro plan: unlimited tables/items/staff. KNN recommendations + Apriori. Advanced analytics.',
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
        description: 'Premium plan: everything in Pro + custom branding, export reports, priority support.',
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

    console.log('Subscription plans seeded');

    // 2. Initialize Subscription records for all existing restaurants
    const restaurants = await Restaurant.find({});
    console.log(`Found ${restaurants.length} restaurants`);

    for (const restaurant of restaurants) {
      const existingSub = await Subscription.findOne({ restaurant: restaurant._id });
      if (existingSub) continue;

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
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        autoRenew: true,
      });
      await subscription.save();
      console.log(`Subscription TRIALING for restaurant: ${restaurant.name}`);
    }

    // 3. Create initial invoices for trial restaurants
    const trialRestaurants = await Restaurant.find({
      verificationStatus: 'VERIFIED',
      restaurantStatus: 'ACTIVE',
    }).limit(20);

    for (const restaurant of trialRestaurants) {
      const sub = await Subscription.findOne({ restaurant: restaurant._id });
      if (!sub || sub.status !== 'TRIALING') continue;

      const invoice = new Invoice({
        restaurant: restaurant._id,
        subscription: sub._id,
        amount: 0,
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        paymentMethod: 'pay_after_meal',
      });
      await invoice.save();
    }

    console.log('Initial subscriptions and invoices created');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

importData();
