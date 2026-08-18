import crypto from 'crypto';
import userRepository from '../repositories/UserRepository.js';
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

  async registerRestaurantOwner({ name, email, phone, password, restaurant }) {
    const exists = await this.users.findByEmail(email);
    if (exists) throw new ApiError(409, 'This email is already registered', null, ErrorCodes.CONFLICT);

    // 1. Create user as ADMIN role with restaurant association
    const user = await this.users.createByRole(USER_ROLES.ADMIN, {
      name,
      email,
      phone,
      password,
      restaurant,
    });

    // 2. Create Free/Trial subscription for the restaurant
    const freePlan = await this.models.SubscriptionPlan.findOne({ name: 'Free / Trial' });
    if (!freePlan) throw new Error('Free/Trial plan not found - cannot create subscription');

    const subscription = new this.models.Subscription({
      restaurant: restaurant,
      plan: freePlan._id,
      status: 'TRIALING',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      autoRenew: true,
    });
    await subscription.save();

    // 3. Create initial PENDING invoice for the trial
    const invoice = new this.models.Invoice({
      restaurant,
      subscription: subscription._id,
      amount: 0,
      billingPeriodStart: new Date(),
      billingPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
      paymentMethod: 'pay_after_meal',
    });
    await invoice.save();

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