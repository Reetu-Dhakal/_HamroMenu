import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const USER_ROLES = {
  CUSTOMER: 'customer',
  STAFF: 'staff',
  KITCHEN: 'kitchen',
  ADMIN: 'admin',
};

export const USER_ROLE_VALUES = Object.values(USER_ROLES);

export const userBaseFields = {
  name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: [80, 'Name too long'] },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  phone: { type: String, trim: true },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  role: { type: String, required: true, enum: USER_ROLE_VALUES },
  avatarUrl: { type: String, default: '' },
  avatarPublicId: { type: String, default: '' },
  passwordChangedAt: { type: Date },
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },
  isActive: { type: Boolean, default: true },
  refreshToken: { type: String, select: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
};

export function createUserBaseSchema(extraFields = {}, extraOptions = {}) {
  const schema = new mongoose.Schema(
    {
      ...userBaseFields,
      ...extraFields,
    },
    {
      timestamps: true,
      toJSON: {
        virtuals: true,
        versionKey: false,
        transform: (_doc, ret) => {
          delete ret.password;
          delete ret.refreshToken;
          delete ret.__v;
          return ret;
        },
      },
      ...extraOptions,
    }
  );

  schema.methods.comparePassword = async function (candidate) {
    if (!this.password) return false;
    return bcrypt.compare(candidate, this.password);
  };

  schema.methods.setPassword = async function (plain) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(plain, salt);
  };

  schema.methods.changedPasswordAfter = function (jwtTimestamp) {
    if (this.passwordChangedAt) {
      const changed = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
      return jwtTimestamp < changed;
    }
    return false;
  };

  schema.methods.hasRole = function (...roles) {
    return roles.includes(this.role);
  };

  schema.methods.toSafeJSON = function () {
    const ret = this.toJSON();
    delete ret.password;
    delete ret.refreshToken;
    return ret;
  };

  return schema;
}

export default createUserBaseSchema;