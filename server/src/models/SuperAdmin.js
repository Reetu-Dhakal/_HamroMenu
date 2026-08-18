import { model } from 'mongoose';
import createUserBaseSchema, { USER_ROLES } from './UserBase.js';

const SuperAdminSchema = createUserBaseSchema({
  permissions: { type: [String], default: ['*'] },
});

const SuperAdmin = model('SuperAdmin', SuperAdminSchema);

SuperAdmin.role = USER_ROLES.SUPER_ADMIN;
export default SuperAdmin;