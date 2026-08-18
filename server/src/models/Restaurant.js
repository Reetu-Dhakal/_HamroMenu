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
    owner: { type: Schema.Types.ObjectId, ref: 'Admin' },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED', 'MANUAL_REVIEW'],
      default: 'PENDING',
    },
    restaurantStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'SUSPENDED'],
      default: 'PENDING',
    },
    businessRegistrationNumber: { type: String, trim: true, sparse: true, unique: true },
    panNumber: { type: String, trim: true, sparse: true },
    documents: [
      {
        type: { type: String, enum: ['license', 'pan', 'owner_id', 'other'], required: true },
        url: { type: String, required: true },
        publicId: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    verificationChecks: {
      requiredInfo: { type: Boolean, default: false },
      validEmail: { type: Boolean, default: false },
      validPhone: { type: Boolean, default: false },
      registrationNumber: { type: Boolean, default: false },
      noDuplicateReg: { type: Boolean, default: false },
      noDuplicateRestaurant: { type: Boolean, default: false },
      documentsUploaded: { type: Boolean, default: false },
      infoConsistency: { type: Boolean, default: false },
    },
    verificationNote: { type: String, default: '' },
    verifiedAt: { type: Date },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    suspendedAt: { type: Date },
  },
  { timestamps: true }
);

RestaurantSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

RestaurantSchema.index({ owner: 1 });
RestaurantSchema.index({ verificationStatus: 1, restaurantStatus: 1 });
RestaurantSchema.index({ 'address.city': 1, name: 1 });

export default model('Restaurant', RestaurantSchema);