import { Schema, model } from 'mongoose';
import createUserBaseSchema, { USER_ROLES } from './UserBase.js';

const AdminSchema = createUserBaseSchema({
  // Restaurant owned/managed by this user. Required for restaurant owners
  // (admin) and managers; absent for legacy docs created before
  // self-registration (backward compatible).
  restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', default: null },
  permissions: { type: [String], default: ['*'] },
});

AdminSchema.index({ restaurant: 1 });

const Admin = model('Admin', AdminSchema);

Admin.role = USER_ROLES.ADMIN;
export default Admin;