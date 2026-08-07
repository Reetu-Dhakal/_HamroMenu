import QRCode from 'qrcode';
import crypto from 'crypto';
import config from '../config/index.js';
import restaurantRepository from '../repositories/RestaurantRepository.js';
import CloudinaryService from './CloudinaryService.js';
import ApiError from '../utils/ApiError.js';

class QRService {
  constructor() {
    this.repository = restaurantRepository;
    this.cloudinary = CloudinaryService;
  }

  buildPayload({ restaurantId, tableId, tableNumber }) {
    const token = crypto.randomBytes(12).toString('hex');
    return JSON.stringify({ restaurantId, tableId, tableNumber, token });
  }

  scanTarget(payload) {
    const { restaurantId, tableId } = JSON.parse(payload);
    return `${config.clientUrl}/order?r=${restaurantId}&t=${tableId}`;
  }

  async generateQRCode(restaurant, table, { persist = true } = {}) {
    const payload = this.buildPayload({
      restaurantId: restaurant._id.toString(),
      tableId: table._id.toString(),
      tableNumber: table.number,
    });
    const target = this.scanTarget(payload);

    const dataUrl = await QRCode.toDataURL(target, {
      width: 512,
      margin: 2,
      color: { dark: '#1b1b1b', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    });

    let uploadResult = null;
    if (this.cloudinary.isConfigured()) {
      try {
        const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
        uploadResult = await this.cloudinary.uploadBuffer(Buffer.from(base64, 'base64'), {
          folder: 'hamromenu/qr',
          transformation: { format: 'png' },
        });
      } catch (err) {
        uploadResult = null;
      }
    }

    const qrDoc = {
      restaurant: restaurant._id,
      table: table._id,
      payload,
      dataUrl: uploadResult ? uploadResult.url : dataUrl,
      publicId: uploadResult ? uploadResult.publicId : '',
    };

    if (!persist) return { ...qrDoc, target };
    const created = await this.repository.createQR(qrDoc);
    return { ...created.toObject(), target };
  }

  async regenerateForTable(restaurant, table) {
    const existing = await this.repository.qrByTable(restaurant._id, table._id);
    if (existing && existing.publicId) {
      await this.cloudinary.deleteByPublicId(existing.publicId).catch(() => {});
    }
    const fresh = await this.generateQRCode(restaurant, table, { persist: false });
    const saved = existing
      ? await this.repository.qrCodes.findByIdAndUpdate(existing._id, {
          payload: fresh.payload,
          dataUrl: fresh.dataUrl,
          publicId: fresh.publicId,
        })
      : await this.repository.createQR(fresh);
    return { ...saved.toObject(), target: fresh.target };
  }

  async scan(payload) {
    let parsed;
    try {
      parsed = JSON.parse(payload);
    } catch (e) {
      throw new ApiError(400, 'Invalid QR payload');
    }
    const { restaurantId, tableId } = parsed;
    const table = await this.repository.tableById(tableId);
    if (!table || !table.isActive) throw new ApiError(404, 'Table not found');
    if (table.restaurant.toString() !== restaurantId)
      throw new ApiError(400, 'QR does not match table');

    const qr = await this.repository.qrByPayload(payload);
    if (qr) {
      await this.repository.qrCodes.updateOne({ _id: qr._id }, { $inc: { scans: 1 }, $set: { lastScannedAt: new Date() } });
    }

    return { restaurantId, table: table.toObject(), payload };
  }

  async listForRestaurant(restaurantId) {
    return this.repository.listQR(restaurantId);
  }
}

export default new QRService();