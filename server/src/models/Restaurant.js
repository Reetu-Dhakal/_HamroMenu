import { Schema, model } from 'mongoose';

const OperatingHoursSchema = new Schema(
  {
    day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], required: true },
    open: { type: String, default: '09:00' },
    close: { type: String, default: '22:00' },
    closed: { type: Boolean, default: false },
  },
  { _id: false }
);

const RestaurantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    tagline: { type: String, default: '' },
    cuisine: { type: [String], default: [] },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zip: String,
    },
    contact: {
      phone: String,
      email: String,
      website: String,
    },
    logoUrl: { type: String, default: '' },
    logoPublicId: { type: String, default: '' },
    coverUrl: { type: String, default: '' },
    coverPublicId: { type: String, default: '' },
    currency: { type: String, default: 'NPR' },
    taxRate: { type: Number, default: 0.13 },
    serviceChargeRate: { type: Number, default: 0.1 },
    isOpen: { type: Boolean, default: true },
    operatingHours: { type: [OperatingHoursSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

RestaurantSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

export default model('Restaurant', RestaurantSchema);