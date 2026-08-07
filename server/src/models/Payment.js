import { Schema, model } from 'mongoose';

export const PAYMENT_METHOD = {
  ESEWA: 'esewa',
  KHALTI: 'khalti',
  CARD: 'card',
  CASH: 'cash',
  PAY_AFTER_MEAL: 'pay_after_meal',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

const PaymentSchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant' },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    table: { type: Schema.Types.ObjectId, ref: 'Table' },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'NPR' },
    method: { type: String, enum: Object.values(PAYMENT_METHOD), required: true },
    status: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING, index: true },
    gatewayRef: { type: String },
    transactionId: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
    paidAt: { type: Date },
    receivedBy: { type: Schema.Types.ObjectId },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

PaymentSchema.index({ order: 1, method: 1 });
PaymentSchema.index({ customer: 1, createdAt: -1 });
export default model('Payment', PaymentSchema);