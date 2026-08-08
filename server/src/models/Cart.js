import { Schema, model } from 'mongoose';

const CartItemSchema = new Schema(
  {
    menuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String },
    unitPrice: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    specialInstructions: { type: String, default: '', maxlength: 500 },
    options: { type: Schema.Types.Mixed, default: {} },
    optionsLabel: { type: String, default: '' },
    lineTotal: { type: Number, default: 0 },
  },
  { _id: true }
);

CartItemSchema.pre('save', function (next) {
  this.lineTotal = (this.unitPrice || 0) * (this.quantity || 0);
  next();
});

const CartSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    table: { type: Schema.Types.ObjectId, ref: 'Table' },
    items: { type: [CartItemSchema], default: [] },
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    appliedCoupon: {
      code: String,
      discountType: { type: String, enum: ['percentage', 'flat'] },
      discountValue: Number,
      maxDiscount: Number,
    },
    subtotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    serviceCharge: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    itemCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CartSchema.methods.applyCoupon = function (coupon, subtotal) {
  if (!coupon || !coupon.discountType || coupon.discountValue == null) return 0;
  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (subtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else {
    discount = Math.min(coupon.discountValue, subtotal);
  }
  this.appliedCoupon = {
    code: coupon.code || '',
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maxDiscount: coupon.maxDiscount || 0,
  };
  return Math.round(discount * 100) / 100;
};

CartSchema.methods.calculateTotals = function (taxRate = 0, serviceChargeRate = 0) {
  const subtotal = this.items.reduce((sum, it) => sum + (it.lineTotal || 0), 0) || 0;
  let discountTotal = 0;
  if (this.appliedCoupon && this.appliedCoupon.discountType != null) {
    discountTotal = this.applyCoupon(this.appliedCoupon, subtotal);
  }
  const taxable = Math.max(0, subtotal - discountTotal);
  const tax = Math.round(taxable * (taxRate || 0) * 100) / 100;
  const serviceCharge = Math.round(subtotal * (serviceChargeRate || 0) * 100) / 100;
  const grandTotal = Math.round((taxable + tax + serviceCharge) * 100) / 100;
  const itemCount = this.items.reduce((sum, it) => sum + it.quantity, 0);

  this.subtotal = Math.round(subtotal * 100) / 100;
  this.discountTotal = discountTotal;
  this.tax = tax;
  this.serviceCharge = serviceCharge;
  this.grandTotal = grandTotal;
  this.itemCount = itemCount;
  return this;
};

CartSchema.methods.appliedCouponAsObject = function () {
  const c = this.appliedCoupon;
  if (!c) return null;
  return {
    discountType: c.discountType,
    discountValue: c.discountValue,
    maxDiscount: c.maxDiscount || 0,
  };
};

CartSchema.methods.isEmpty = function () {
  return this.items.length === 0;
};

CartSchema.index({ customer: 1 }, { unique: true });
CartSchema.index({ restaurant: 1, customer: 1 });
export default model('Cart', CartSchema);