import restaurantRepository from '../repositories/RestaurantRepository.js';
import menuService from '../services/MenuService.js';
import qrService from '../services/QRService.js';
import CloudinaryService from '../services/CloudinaryService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';

class RestaurantController {
  async getBySlug(req, res, next) {
    asyncHandler(async () => {
      const restaurant = await menuService.getRestaurant(req.params.slug);
      return ApiResponse.send(res, 200, restaurant);
    })(req, res, next);
  }

  async getById(req, res, next) {
    asyncHandler(async () => {
      const restaurant = await restaurantRepository.findById(req.params.restaurantId);
      if (!restaurant) throw new ApiError(404, 'Restaurant not found');
      return ApiResponse.send(res, 200, restaurant);
    })(req, res, next);
  }

  async tables(req, res, next) {
    asyncHandler(async () => {
      const tables = await restaurantRepository.tablesFor(req.params.restaurantId);
      return ApiResponse.send(res, 200, tables);
    })(req, res, next);
  }

  async scanQR(req, res, next) {
    asyncHandler(async () => {
      const result = await qrService.scan(req.body.payload);
      return ApiResponse.send(res, 200, result, 'QR verified');
    })(req, res, next);
  }

  async qrForTable(req, res, next) {
    asyncHandler(async () => {
      const restaurant = await restaurantRepository.findById(req.params.restaurantId);
      if (!restaurant) throw new ApiError(404, 'Restaurant not found');
      const table = await restaurantRepository.tableById(req.params.tableId);
      if (!table) throw new ApiError(404, 'Table not found');

      let qr = await restaurantRepository.qrByTable(restaurant._id, table._id);
      if (!qr || !qr.dataUrl) {
        qr = await qrService.generateQRCode(restaurant, table, { persist: true });
      }
      return ApiResponse.send(res, 200, qr);
    })(req, res, next);
  }

  async regenerateQR(req, res, next) {
    asyncHandler(async () => {
      const restaurant = await restaurantRepository.findById(req.params.restaurantId);
      const table = await restaurantRepository.tableById(req.params.tableId);
      const qr = await qrService.regenerateForTable(restaurant, table);
      return ApiResponse.send(res, 200, qr, 'QR regenerated');
    })(req, res, next);
  }

  async uploadImage(req, res, next) {
    asyncHandler(async () => {
      if (!req.file) throw new ApiError(400, 'No file uploaded');
      const result = await CloudinaryService.uploadFile(req.file, { folder: `hamromenu/${req.body.folder || 'general'}` });
      return ApiResponse.send(res, 200, result, 'Image uploaded');
    })(req, res, next);
  }
}

export default new RestaurantController();