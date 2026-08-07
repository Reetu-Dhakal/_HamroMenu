import { Schema, model } from 'mongoose';
import createUserBaseSchema, { USER_ROLES } from './UserBase.js';

const KitchenStaffSchema = createUserBaseSchema({
  restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  station: { type: String, default: 'main' },
  shift: { type: String, enum: ['morning', 'evening', 'full'], default: 'full' },
  hiredAt: { type: Date, default: Date.now },
});

const KitchenStaff = model('KitchenStaff', KitchenStaffSchema);

KitchenStaff.role = USER_ROLES.KITCHEN;
export default KitchenStaff;