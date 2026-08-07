import { Schema, model } from 'mongoose';

const TableSchema = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    label: { type: String, required: true, trim: true },
    number: { type: Number, required: true },
    capacity: { type: Number, default: 2 },
    area: { type: String, default: 'main' },
    status: { type: String, enum: ['free', 'occupied', 'reserved', 'cleaning'], default: 'free' },
    currentOrder: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    qrCode: { type: Schema.Types.ObjectId, ref: 'QRCode', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

TableSchema.index({ restaurant: 1, number: 1 }, { unique: true });
TableSchema.index({ restaurant: 1, status: 1 });

export default model('Table', TableSchema);