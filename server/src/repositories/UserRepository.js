import mongoose from 'mongoose';
import BaseRepository from './BaseRepository.js';
import Customer from '../models/Customer.js';
import Staff from '../models/Staff.js';
import KitchenStaff from '../models/KitchenStaff.js';
import SuperAdmin from '../models/SuperAdmin.js';
import Admin from '../models/Admin.js';
import { USER_ROLES } from '../models/UserBase.js';
import ApiError from '../utils/ApiError.js';

const MODEL_BY_ROLE = {
  [USER_ROLES.CUSTOMER]: Customer,
  [USER_ROLES.STAFF]: Staff,
  [USER_ROLES.KITCHEN]: KitchenStaff,
  [USER_ROLES.ADMIN]: Admin,
  [USER_ROLES.SUPER_ADMIN]: SuperAdmin,
};

class UserRepository extends BaseRepository {
  constructor() {
    super(Customer);
    this.roleModels = MODEL_BY_ROLE;
  }

  static modelForRole(role) {
    return MODEL_BY_ROLE[role] || null;
  }

  modelFor(role) {
    return UserRepository.modelForRole(role);
  }

  async findByEmail(email) {
    for (const role of Object.values(USER_ROLES)) {
      const M = UserRepository.modelForRole(role);
      if (!M) continue;
      const user = await M.findOne({ email }).select('+password +refreshToken');
      if (user) return user;
    }
    return null;
  }

  async findByIdAcrossRoles(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    for (const role of Object.values(USER_ROLES)) {
      const M = UserRepository.modelForRole(role);
      if (!M) continue;
      const user = await M.findById(id).select('+password +refreshToken');
      if (user) return user;
    }
    return null;
  }

  async createByRole(role, data) {
    const M = UserRepository.modelForRole(role);
    if (!M) throw new ApiError(400, 'Invalid role');
    const user = new M();
    user.role = role;
    Object.assign(user, data);
    await user.setPassword(data.password);
    return user.save();
  }

  async setRefreshToken(user) {
    const M = UserRepository.modelForRole(user.role);
    if (!M) return;
    await M.updateOne({ _id: user._id }, { $set: { refreshToken: user.refreshToken } });
  }

  async clearRefreshToken(user) {
    const M = UserRepository.modelForRole(user.role);
    if (!M) return;
    await M.updateOne({ _id: user._id }, { $unset: { refreshToken: "" } });
  }

  async listStaff(restaurantId) {
    return Staff.find({ restaurant: restaurantId }, { sort: { createdAt: -1 } });
  }

  async listKitchen(restaurantId) {
    return KitchenStaff.find({ restaurant: restaurantId }, { sort: { createdAt: -1 } });
  }

  getRepo(role) {
    return new BaseRepository(UserRepository.modelForRole(role));
  }
}

export default new UserRepository();
export { UserRepository };