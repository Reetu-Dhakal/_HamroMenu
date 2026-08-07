import { Schema, model } from 'mongoose';
import createUserBaseSchema, { USER_ROLES } from './UserBase.js';

const CustomerSchema = createUserBaseSchema({
  favorites: { type: [Schema.Types.ObjectId], ref: 'MenuItem', default: [] },
  orderHistoryCount: { type: Number, default: 0 },
  lastOrderAt: { type: Date },
  preferences: {
    spiceLevel: { type: String, enum: ['mild', 'medium', 'hot', 'extra-hot'], default: 'medium' },
    dietary: { type: [String], default: [] },
  },
});

const Customer = model('Customer', CustomerSchema);

Customer.role = USER_ROLES.CUSTOMER;
export default Customer;