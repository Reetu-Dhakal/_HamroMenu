import userRepository from '../repositories/UserRepository.js';
import BaseRepository from '../repositories/BaseRepository.js';
import Customer from '../models/Customer.js';
import Review from '../models/Review.js';
import MenuItem from '../models/MenuItem.js';
import ApiError, { ErrorCodes } from '../utils/ApiError.js';
import { USER_ROLES } from '../models/UserBase.js';

class CustomerService {
  constructor() {
    this.users = userRepository;
    this.customers = new BaseRepository(Customer);
    this.reviews = new BaseRepository(Review);
  }

  async getProfile(customerId) {
    const customer = await this.customers.findById(customerId);
    if (!customer) throw new ApiError(404, 'Customer not found', null, ErrorCodes.NOT_FOUND);
    return customer;
  }

  async updateProfile(customerId, updates) {
    const allowed = ['name', 'phone', 'avatarUrl', 'preferences'];
    const clean = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) clean[key] = updates[key];
    }
    if (updates.password) {
      const user = await this.users.findByIdAcrossRoles(customerId);
      if (user) {
        await user.setPassword(updates.password);
        user.passwordChangedAt = new Date();
        await user.save();
      }
    }
    return this.customers.findByIdAndUpdate(customerId, clean);
  }

  async incrementOrderCount(customerId) {
    return this.customers.updateOne(
      { _id: customerId },
      { $inc: { orderHistoryCount: 1 }, $set: { lastOrderAt: new Date() } }
    );
  }

  async toggleFavorite(customerId, menuItemId) {
    const customer = await this.getProfile(customerId);
    const favs = customer.favorites.map((f) => f.toString());
    if (favs.includes(menuItemId)) {
      customer.favorites.pull(menuItemId);
    } else {
      const item = await MenuItem.findById(menuItemId);
      if (!item) throw new ApiError(404, 'Menu item not found');
      customer.favorites.push(menuItemId);
    }
    await customer.save();
    return customer.favorites;
  }

  async favorites(customerId) {
    const customer = await this.getProfile(customerId);
    return MenuItem.find({ _id: { $in: customer.favorites } }).lean();
  }

  async addReview(customerId, data) {
    const review = await this.reviews.create({
      customer: customerId,
      ...data,
      isApproved: false,
    });
    return review;
  }

  async listMyReviews(customerId) {
    return this.reviews.find({ customer: customerId }, { sort: { createdAt: -1 } });
  }

  async listStaff(restaurantId) {
    return this.users.find({ restaurant: restaurantId, role: { $ne: USER_ROLES.ADMIN } }, { sort: { createdAt: -1 } });
  }
}

export default new CustomerService();