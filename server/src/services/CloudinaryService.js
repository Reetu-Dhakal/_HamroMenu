import stream from 'stream';
import { cloudinary } from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';

const FOLDER = 'hamromenu';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024;

class CloudinaryService {
  constructor() {
    this.client = cloudinary;
  }

  isConfigured() {
    return Boolean(
      this.client.config().cloud_name &&
        this.client.config().api_key &&
        this.client.config().api_secret
    );
  }

  validateFile(file) {
    if (!file) throw new ApiError(400, 'No file uploaded');
    if (!ALLOWED_TYPES.includes(file.mimetype))
      throw new ApiError(400, `Unsupported file type: ${file.mimetype}`);
    if (file.size > MAX_SIZE)
      throw new ApiError(400, 'File too large. Maximum size is 5MB.');
    return true;
  }

  uploadBuffer(buffer, { folder = FOLDER, publicId, transformation = {} } = {}) {
    return new Promise((resolve, reject) => {
      const uploadStream = this.client.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          public_id: publicId,
          overwrite: true,
          ...transformation,
        },
        (error, result) => {
          if (error) reject(new ApiError(500, 'Image upload failed', error.message));
          else resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      const bufferStream = stream.Readable.from(buffer);
      bufferStream.pipe(uploadStream);
    });
  }

  async uploadFile(file, options = {}) {
    this.validateFile(file);
    return this.uploadBuffer(file.buffer, options);
  }

  async deleteByPublicId(publicId) {
    if (!publicId) return { result: 'not-found' };
    return this.client.uploader.destroy(publicId);
  }

  static placeholder(kind = 'dish', label = '') {
    const labels = {
      dish: 'https://res.cloudinary.com/demo/image/upload/w_600,h_400,c_fill,q_auto,f_auto/demo/food_plate.jpg',
      cover: 'https://res.cloudinary.com/demo/image/upload/w_1600,h_800,c_fill,q_auto,f_auto/demo/restaurant_hero.jpg',
      category: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill,q_auto,f_auto/demo/spices.jpg',
      logo: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill,q_auto,f_auto/demo/logo.jpg',
    };
    return labels[kind] || labels.dish;
  }

  generateImageUrl(publicId, transformation = '') {
    if (!publicId) return '';
    const { cloud_name } = this.client.config();
    return `https://res.cloudinary.com/${cloud_name}/image/upload/${transformation}/${publicId}`;
  }
}

export default new CloudinaryService();