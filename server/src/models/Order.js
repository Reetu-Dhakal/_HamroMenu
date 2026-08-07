import { Schema, model } from 'mongoose';

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const ORDER_STATUS_FLOW = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
  ORDER_STATUS.SERVED,
  ORDER_STATUS.COMPLETED,
];

export const ORDER_SOURCE = {
  QR: 'qr',
  DINE_IN: 'dine_in',
  TAKEAWAY: 'takeaway',
  DELIVERY: 'delivery',
};

const OrderItemSchema = new Schema(
  {
    menuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, default: 0 },
    specialInstructions: { type: String, default: '', maxlength: 500 },
    options: { type: Schema.Types.Mixed, default: {} },
    optionsLabel: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    isVeg: { type: Boolean, default: false },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
    },
  },
  { _id: true }
);

OrderItemSchema.pre('save', function (next) {
  this.lineTotal = (this.price || 0) * (this.quantity || 0);
  next();
});

const statusHistoryEntry = new Schema(
  {
    status: { type: String },
    at: { type: Date, default: Date.now },
    by: { type: Schema.Types.ObjectId },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    table: { type: Schema.Types.ObjectId, ref: 'Table' },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    source: { type: String, enum: Object.values(ORDER_SOURCE), default: ORDER_SOURCE.QR },
    items: { type: [OrderItemSchema], required: true, validate: [(v) => v.length > 0, 'Order must have at least one item'] },
    itemCount: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    serviceCharge: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    couponCode: { type: String, default: '' },
    status: { type: String, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.PENDING, index: true },
    statusHistory: { type: [statusHistoryEntry], default: [] },
    priority: { type: Number, default: 0 },
    estimatedReadyAt: { type: Date },
    acceptedBy: { type: Schema.Types.ObjectId },
    confirmedBy: { type: Schema.Types.ObjectId },
    servedBy: { type: Schema.Types.ObjectId },
    notes: { type: String, default: '', maxlength: 1000 },
    specialRequests: { type: String, default: '', maxlength: 1000 },
    customerNote: { type: String, default: '' },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment' },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded', 'failed'],
      default: 'unpaid',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['esewa', 'khalti', 'card', 'cash', 'pay_after_meal'],
      default: 'pay_after_meal',
    },
    prepTimeTotal: { type: Number, default: 0 },
    placedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String, default: '' },
    isRated: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

OrderSchema.index({ restaurant: 1, status: 1, placedAt: -1 });
OrderSchema.index({ customer: 1, placedAt: -1 });
OrderSchema.index({ table: 1, status: 1 });
OrderSchema.index({ orderNumber: 1 }, { unique: true });

OrderSchema.methods.calculateTotal = function () {
  const subtotal = this.items.reduce((sum, it) => sum + (it.lineTotal || 0), 0);
  this.subtotal = Math.round(subtotal * 100) / 100;
  this.itemCount = this.items.reduce((sum, it) => sum + (it.quantity || 0), 0);
  this.grandTotal = Math.round((subtotal + this.tax + this.serviceCharge - this.discountTotal + this.deliveryFee) * 100) / 100;
  return this.grandTotal;
};

OrderSchema.methods.setStatus = function (status, by = null, note = '') {
  const allowed = {
    [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.READY]: [ORDER_STATUS.SERVED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.SERVED]: [ORDER_STATUS.COMPLETED],
    [ORDER_STATUS.COMPLETED]: [],
    [ORDER_STATUS.CANCELLED]: [],
  };
  const next = allowed[this.status] || [];
  if (!next.includes(status)) {
    const error = new Error(`Invalid status transition from ${this.status} to ${status}`);
    error.code = 'INVALID_STATUS_TRANSITION';
    throw error;
  }
  this.status = status;
  this.statusHistory.push({ status, at: new Date(), by: by || null, note });
  if (status === ORDER_STATUS.COMPLETED) this.completedAt = new Date();
  if (status === ORDER_STATUS.CANCELLED) this.cancelledAt = new Date();
  return this;
};

OrderSchema.methods.isTerminal = function () {
  return [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED].includes(this.status);
};

export default model('Order', OrderSchema);