import { model } from 'mongoose';
import createUserBaseSchema, { USER_ROLES } from './UserBase.js';

const AdminSchema = createUserBaseSchema({
  permissions: { type: [String], default: ['*'] },
});

const Admin = model('Admin', AdminSchema);

Admin.role = USER_ROLES.ADMIN;
export default Admin;