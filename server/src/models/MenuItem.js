import { Schema, model } from 'mongoose';

const MenuItemSchema = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
    discountedPrice: { type: Number, min: 0 },
    imageUrl: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
    prepTimeMinutes: { type: Number, default: 10 },
    ingredients: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    spiceLevel: { type: String, enum: ['mild', 'medium', 'hot', 'extra-hot'], default: 'medium' },
    isVeg: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
    isRecommended: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
    options: [
      {
        title: { type: String },
        required: { type: Boolean, default: false },
        choices: [
          {
            label: { type: String },
            priceDelta: { type: Number, default: 0 },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

MenuItemSchema.index({ restaurant: 1, category: 1 });
MenuItemSchema.index({ restaurant: 1, isAvailable: 1 });
MenuItemSchema.index({ restaurant: 1, isFeatured: 1 });
MenuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });

MenuItemSchema.methods.effectivePrice = function () {
  if (this.discountedPrice != null && this.discountedPrice < this.price) return this.discountedPrice;
  return this.price;
};

export default model('MenuItem', MenuItemSchema);