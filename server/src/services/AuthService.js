import crypto from 'crypto';
import mongoose from 'mongoose';
import userRepository from '../repositories/UserRepository.js';
import Restaurant from '../models/Restaurant.js';
import Subscription from '../models/Subscription.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Invoice from '../models/Invoice.js';
import { generateTokenPair, signAccessToken, verifyAccessToken, verifyRefreshToken } from '../utils/jwt.js';
import ApiError, { ErrorCodes } from '../utils/ApiError.js';
import { USER_ROLES } from '../models/UserBase.js';

class AuthService {
  constructor() {
    this.users = userRepository;
    this.models = { Subscription, SubscriptionPlan, Invoice };
  }

  async registerCustomer({ name, email, phone, password }) {
    const exists = await this.users.findByEmail(email);
    if (exists) throw new ApiError(409, 'An account with this email already exists', null, ErrorCodes.CONFLICT);
    const user = await this.users.createByRole(USER_ROLES.CUSTOMER, { name, email, phone, password });
    return this.buildAuthPayload(user);
  }

  async registerStaff({ name, email, phone, password, restaurant, staffRole = 'waiter', shift }) {
    const exists = await this.users.findByEmail(email);
    if (exists) throw new ApiError(409, 'This email is already registered', null, ErrorCodes.CONFLICT);
    const user = await this.users.createByRole(USER_ROLES.STAFF, {
      name,
      email,
      phone,
      password,
      restaurant,
      staffRole,
      shift,
    });
    return this.buildAuthPayload(user);
  }

  async registerKitchen({ name, email, phone, password, restaurant, station, shift }) {
    const exists = await this.users.findByEmail(email);
    if (exists) throw new ApiError(409, 'This email is already registered', null, ErrorCodes.CONFLICT);
    const user = await this.users.createByRole(USER_ROLES.KITCHEN, {
      name,
      email,
      phone,
      password,
      restaurant,
      station,
      shift,
    });
    return this.buildAuthPayload(user);
  }

  async registerAdmin({ name, email, password }) {
    const exists = await this.users.findByEmail(email);
    if (exists) throw new ApiError(409, 'This email is already registered', null, ErrorCodes.CONFLICT);
    const user = await this.users.createByRole(USER_ROLES.ADMIN, { name, email, password });
    return this.buildAuthPayload(user);
  }

  /**
   * Restaurant owner self-registration.
   * Creates: Admin user + Restaurant document + Subscription + Invoice,
   * links owner <-> restaurant, initialises verification as PENDING.
   * Backward compatible: if `restaurant` is an existing ObjectId string,
   * the owner is linked to that restaurant instead of creating a new one.
   */
  async registerRestaurantOwner({
    name, email, phone, password,
    restaurant, restaurantName, restaurantDetails, planName,
    businessRegistrationNumber, panNumber, address, contact, description, cuisine,
  }) {
    const exists = await this.users.findByEmail(email);
    if (exists) throw new ApiError(409, 'This email is already registered', null, ErrorCodes.CONFLICT);

    let restaurantDoc = null;
    let createdNewRestaurant = false;
    const isObjectId = (v) => v && mongoose.Types.ObjectId.isValid(String(v));

    // Legacy path: caller passed an existing restaurant id -> link owner to it
    if (typeof restaurant === 'string' && isObjectId(restaurant)) {
      restaurantDoc = await Restaurant.findById(restaurant);
      if (!restaurantDoc) throw new ApiError(404, 'Restaurant not found');
    } else {
      // New self-registration path: build restaurant data from all accepted shapes
      const details = (restaurant && typeof restaurant === 'object') ? restaurant : (restaurantDetails || {});
      const rName = restaurantName || details.name || (typeof restaurant === 'string' && restaurant.trim() ? restaurant : null) || `${name}'s Restaurant`;
      const rAddress = address || details.address || {};
      const rContact = contact || details.contact || { phone, email };
      const rDescription = description ?? details.description ?? '';
      const rCuisine = cuisine || details.cuisine || [];
      const regNo = businessRegistrationNumber || details.businessRegistrationNumber || undefined;
      const pan = panNumber || details.panNumber || undefined;

      const emailOk = /^\S+@\S+\.\S+$/.test(rContact?.email || email || '');
      const phoneOk = Boolean((rContact?.phone || phone || '').trim());
      const hasRequired = Boolean(rName && rName.trim().length >= 2);

      // Rule-based verification checks (manual review by Super Admin later;
      // NOT connected to any external authority)
      let duplicateReg = false;
      if (regNo) {
        const dup = await Restaurant.findOne({ businessRegistrationNumber: regNo }).lean();
        duplicateReg = Boolean(dup);
      }

      restaurantDoc = await Restaurant.create({
        name: rName,
        description: rDescription,
        cuisine: Array.isArray(rCuisine) ? rCuisine : [],
        address: {
          street: rAddress.street || '',
          city: rAddress.city || '',
          state: rAddress.state || '',
          country: rAddress.country || 'Nepal',
          zip: rAddress.zip || '',
        },
        contact: {
          phone: rContact.phone || phone || '',
          email: rContact.email || email || '',
          website: rContact.website || '',
        },
        ...(regNo ? { businessRegistrationNumber: regNo } : {}),
        ...(pan ? { panNumber: pan } : {}),
        verificationStatus: 'PENDING',
        restaurantStatus: 'PENDING',
        verificationChecks: {
          requiredInfo: hasRequired,
          validEmail: emailOk,
          validPhone: phoneOk,
          registrationNumber: Boolean(regNo),
          noDuplicateReg: !duplicateReg,
          noDuplicateRestaurant: true,
          documentsUploaded: false,
          infoConsistency: hasRequired && emailOk,
        },
        verificationNote: duplicateReg ? 'Possible duplicate business registration number - needs manual review.' : '',
      });
      createdNewRestaurant = true;
    }

    // Rollback guard: no MongoDB transactions in this project (standalone
    // deployments don't support them), so unwind created docs best-effort
    // to avoid partial registration (orphan restaurant/owner/subscription).
    let user = null;
    let subscription = null;
    let invoice = null;
    try {
      // 1. Create owner user (ADMIN role = restaurant owner) linked to restaurant
      user = await this.users.createByRole(USER_ROLES.ADMIN, {
        name,
        email,
        phone,
        password,
        restaurant: restaurantDoc._id,
      });

      // Link restaurant -> owner (owner ref lives on Restaurant)
      restaurantDoc.owner = user._id;
      await restaurantDoc.save();

      // 2. Create subscription (requested plan if valid, else Free/Trial)
      let plan = null;
      if (planName) {
        plan = await this.models.SubscriptionPlan.findOne({ name: planName, isActive: true });
      }
      if (!plan) {
        plan = await this.models.SubscriptionPlan.findOne({ name: 'Free / Trial' });
      }
      if (!plan) throw new Error('Free/Trial plan not found - cannot create subscription');

      const trialDays = plan.trialDays || 14;
      subscription = new this.models.Subscription({
        restaurant: restaurantDoc._id,
        plan: plan._id,
        status: plan.price === 0 ? 'TRIALING' : 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000),
        autoRenew: true,
      });
      await subscription.save();

      // 3. Create initial PENDING invoice for the trial/subscription
      invoice = new this.models.Invoice({
        restaurant: restaurantDoc._id,
        subscription: subscription._id,
        amount: plan.price || 0,
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        paymentMethod: 'pay_after_meal',
      });
      await invoice.save();

      const payload = await this.buildAuthPayload(user);
      return { ...payload, restaurant: restaurantDoc, subscription };
    } catch (err) {
      // Best-effort unwind in reverse creation order. Never delete a
      // pre-existing (legacy-linked) restaurant.
      if (invoice?._id) await this.models.Invoice.deleteOne({ _id: invoice._id }).catch(() => {});
      if (subscription?._id) await this.models.Subscription.deleteOne({ _id: subscription._id }).catch(() => {});
      if (user?._id) {
        const M = this.users.modelFor(user.role);
        if (M) await M.deleteOne({ _id: user._id }).catch(() => {});
      }
      if (createdNewRestaurant && restaurantDoc?._id) {
        await Restaurant.deleteOne({ _id: restaurantDoc._id }).catch(() => {});
      } else if (restaurantDoc && user?._id && String(restaurantDoc.owner) === String(user._id)) {
        restaurantDoc.owner = undefined;
        await restaurantDoc.save().catch(() => {});
      }
      throw err;
    }
  }

  /** Delegated manager account (uses Admin model, MANAGER role). */
  async registerManager({ name, email, phone, password, restaurant }) {
    const exists = await this.users.findByEmail(email);
    if (exists) throw new ApiError(409, 'This email is already registered', null, ErrorCodes.CONFLICT);
    if (!restaurant) throw new ApiError(400, 'Restaurant is required for manager accounts');
    const user = await this.users.createByRole(USER_ROLES.MANAGER, {
      name, email, phone, password, restaurant,
    });
    return this.buildAuthPayload(user);
  }

  async registerSuperAdmin({ name, email, password }) {
    const exists = await this.users.findByEmail(email);
    if (exists) throw new ApiError(409, 'This email is already registered', null, ErrorCodes.CONFLICT);
    const user = await this.users.createByRole(USER_ROLES.SUPER_ADMIN, { name, email, password });
    return this.buildAuthPayload(user);
  }

  async login(email, plainPassword) {
    const user = await this.users.findByEmail(email);
    if (!user || !user.isActive)
      throw new ApiError(401, 'Invalid email or password', null, ErrorCodes.INVALID_CREDENTIALS);
    const ok = await user.comparePassword(plainPassword);
    if (!ok) throw new ApiError(401, 'Invalid email or password', null, ErrorCodes.INVALID_CREDENTIALS);
    return this.buildAuthPayload(user);
  }

  async buildAuthPayload(user) {
    const tokens = generateTokenPair(user);
    user.refreshToken = tokens.refreshToken;
    await this.users.setRefreshToken(user);
    return { user: user.toSafeJSON(), ...tokens };
  }

  async refresh(refreshToken) {
    if (!refreshToken) throw new ApiError(401, 'Refresh token required', null, ErrorCodes.UNAUTHORIZED);
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new ApiError(401, 'Invalid or expired refresh token', null, ErrorCodes.UNAUTHORIZED);
    }
    const user = await this.users.findByIdAcrossRoles(payload.id);
    if (!user || !user.isActive) throw new ApiError(401, 'User not found', null, ErrorCodes.UNAUTHORIZED);
    if (!user.refreshToken || user.refreshToken !== refreshToken)
      throw new ApiError(401, 'Refresh token mismatch', null, ErrorCodes.UNAUTHORIZED);

    const accessToken = signAccessToken(user);
    const newRefreshToken = generateTokenPair(user).refreshToken;
    user.refreshToken = newRefreshToken;
    await this.users.setRefreshToken(user);
    return { accessToken, refreshToken: newRefreshToken, user: user.toSafeJSON() };
  }

  async logout(user) {
    await this.users.clearRefreshToken(user);
    return { success: true };
  }

  async verifyAccess(token) {
    const payload = verifyAccessToken(token);
    const user = await this.users.findByIdAcrossRoles(payload.id);
    if (!user || !user.isActive) throw new ApiError(401, 'User not found or deactivated', null, ErrorCodes.UNAUTHORIZED);
    if (user.changedPasswordAfter(payload.iat))
      throw new ApiError(401, 'Password recently changed. Please login again.', null, ErrorCodes.UNAUTHORIZED);
    return { user, tokenPayload: payload };
  }

  async requestPasswordReset(email) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new ApiError(404, 'No account found with this email', null, ErrorCodes.NOT_FOUND);
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await this.users.getRepo(user.role).updateOne(
      { _id: user._id },
      { $set: { resetPasswordToken: user.resetPasswordToken, resetPasswordExpires: user.resetPasswordExpires } }
    );
    return { resetToken, email: user.email };
  }

  async resetPassword(resetToken, newPassword) {
    const hashed = crypto.createHash('sha256').update(resetToken).digest('hex');
    for (const role of Object.values(USER_ROLES)) {
      const M = this.users.modelFor(role);
      const user = await M.findOne({ resetPasswordToken: hashed }).select('+resetPasswordToken +resetPasswordExpires');
      if (user) {
        if (!user.resetPasswordExpires || user.resetPasswordExpires < Date.now())
          throw new ApiError(400, 'Reset token expired');
        await user.setPassword(newPassword);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.passwordChangedAt = new Date();
        await user.save();
        return { success: true };
      }
    }
    throw new ApiError(400, 'Invalid reset token');
  }
}

export default new AuthService();