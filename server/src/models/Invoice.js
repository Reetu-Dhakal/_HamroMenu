import { model, Types } from 'mongoose';

const InvoiceSchema = new mongoose.Schema(
  {
    restaurant: {
      type: Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    subscription: {
      type: Types.ObjectId,
      ref: 'Subscription',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    billingPeriodStart: {
      type: Date,
      default: Date.now,
    },
    billingPeriodEnd: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED'],
      default: 'PENDING',
    },
    paymentMethod: {
      type: String,
      enum: ['esewa', 'khalti', 'card', 'cash', 'pay_after_meal'],
      default: 'pay_after_meal',
    },
    gatewayRef: {
      type: String, // external gateway reference (eSewa/Khalti transaction ID)
    },
    transactionId: {
      type: String, // internal transaction ID
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    paidAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for fast lookups
InvoiceSchema.index({ restaurant: 1, status: 1 });
InvoiceSchema.index({ subscription: 1 });
InvoiceSchema.index({ status: 1, createdAt: -1 });

// Method: mark invoice as paid
InvoiceSchema.methods.markPaid = async function () {
  this.status = 'PAID';
  this.paidAt = new Date();
  await this.save();
  return this;
};

// Static: get unpaid invoices for a restaurant
InvoiceSchema.statics.getUnpaidForRestaurant = function (restaurantId) {
  return this.find({ restaurant: restaurantId, status: 'PENDING' }).lean();
};

// Static: get paid invoices for a restaurant
InvoiceSchema.statics.getPaidForRestaurant = function (restaurantId) {
  return this.find({ restaurant: restaurantId, status: 'PAID' }).lean();
};

export default model('Invoice', InvoiceSchema);