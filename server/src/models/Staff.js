import { Schema, model } from 'mongoose';
import createUserBaseSchema, { USER_ROLES } from './UserBase.js';

const StaffSchema = createUserBaseSchema({
  restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  staffRole: { type: String, default: 'waiter' },
  shift: { type: String, enum: ['morning', 'evening', 'full'], default: 'full' },
  hiredAt: { type: Date, default: Date.now },
});

const Staff = model('Staff', StaffSchema);

Staff.role = USER_ROLES.STAFF;
export default Staff;