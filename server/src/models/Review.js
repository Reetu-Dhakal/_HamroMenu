import { Schema, model } from 'mongoose';

const ReviewSchema = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    menuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: '', maxlength: 120 },
    comment: { type: String, default: '', maxlength: 1000 },
    tags: { type: [String], default: [] },
    images: [
      {
        url: { type: String, default: '' },
        publicId: { type: String, default: '' },
      },
    ],
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ReviewSchema.index({ menuItem: 1, isApproved: 1 });
ReviewSchema.index({ restaurant: 1, createdAt: -1 });
ReviewSchema.index({ customer: 1, order: 1 });
export default model('Review', ReviewSchema);