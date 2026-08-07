import { Schema, model } from 'mongoose';

const CouponSchema = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    discountType: { type: String, enum: ['percentage', 'flat'], required: true, default: 'percentage' },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, default: 0 },
    minOrder: { type: Number, default: 0 },
    maxUses: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    appliesTo: { type: String, enum: ['all', 'categories', 'items'], default: 'all' },
    targetIds: { type: [Schema.Types.ObjectId], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CouponSchema.index({ restaurant: 1, code: 1 }, { unique: true });
CouponSchema.index({ isActive: 1, startsAt: 1, expiresAt: 1 });

CouponSchema.methods.isUsable = function (subtotal = 0, totalUsage = 0, userUsage = 0) {
  if (!this.isActive) return { ok: false, message: 'Coupon is inactive' };
  const now = new Date();
  if (this.startsAt && now < this.startsAt) return { ok: false, message: 'Coupon not yet valid' };
  if (this.expiresAt && now > this.expiresAt) return { ok: false, message: 'Coupon has expired' };
  if (subtotal < this.minOrder)
    return { ok: false, message: `Minimum order of ${this.minOrder} required` };
  if (this.maxUses > 0 && totalUsage >= this.maxUses)
    return { ok: false, message: 'Coupon usage limit reached' };
  if (this.perUserLimit > 0 && userUsage >= this.perUserLimit)
    return { ok: false, message: 'Coupon already used by this customer' };
  return { ok: true, message: 'Valid' };
};

export default model('Coupon', CouponSchema);