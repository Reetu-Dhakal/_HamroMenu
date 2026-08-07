import { Schema, model } from 'mongoose';

const QRCodeSchema = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    table: { type: Schema.Types.ObjectId, ref: 'Table', required: true },
    payload: { type: String, required: true, unique: true },
    dataUrl: { type: String },
    publicId: { type: String },
    scans: { type: Number, default: 0 },
    lastScannedAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

QRCodeSchema.index({ restaurant: 1, table: 1 }, { unique: true });
export default model('QRCode', QRCodeSchema);