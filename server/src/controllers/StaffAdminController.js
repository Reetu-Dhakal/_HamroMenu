import authService from '../services/AuthService.js';
import userRepository from '../repositories/UserRepository.js';
import menuService from '../services/MenuService.js';
import qrService from '../services/QRService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';

class StaffAdminController {
  async registerStaff(req, res, next) {
    asyncHandler(async () => {
      const data = await authService.registerStaff({
        ...req.body,
        restaurant: req.body.restaurant || req.params.restaurantId,
      });
      return ApiResponse.send(res, 201, data, 'Staff account created');
    })(req, res, next);
  }

  async registerKitchen(req, res, next) {
    asyncHandler(async () => {
      const data = await authService.registerKitchen({
        ...req.body,
        restaurant: req.body.restaurant || req.params.restaurantId,
      });
      return ApiResponse.send(res, 201, data, 'Kitchen account created');
    })(req, res, next);
  }

  async listStaff(req, res, next) {
    asyncHandler(async () => {
      const staff = await userRepository.listStaff(req.params.restaurantId);
      return ApiResponse.send(res, 200, staff);
    })(req, res, next);
  }

  async listKitchen(req, res, next) {
    asyncHandler(async () => {
      const kitchen = await userRepository.listKitchen(req.params.restaurantId);
      return ApiResponse.send(res, 200, kitchen);
    })(req, res, next);
  }

  async listQR(req, res, next) {
    asyncHandler(async () => {
      const qrs = await qrService.listForRestaurant(req.params.restaurantId);
      return ApiResponse.send(res, 200, qrs);
    })(req, res, next);
  }

  async listCoupons(req, res, next) {
    asyncHandler(async () => {
      const coupons = await menuService.coupons(req.params.restaurantId);
      return ApiResponse.send(res, 200, coupons);
    })(req, res, next);
  }

  async createCoupon(req, res, next) {
    asyncHandler(async () => {
      const coupon = await menuService.createCoupon(req.params.restaurantId, req.body);
      return ApiResponse.send(res, 201, coupon, 'Coupon created');
    })(req, res, next);
  }

  async updateCoupon(req, res, next) {
    asyncHandler(async () => {
      const coupon = await menuService.updateCoupon(req.params.id, req.body);
      return ApiResponse.send(res, 200, coupon, 'Coupon updated');
    })(req, res, next);
  }

  async deleteCoupon(req, res, next) {
    asyncHandler(async () => {
      await menuService.deleteCoupon(req.params.id);
      return ApiResponse.send(res, 200, null, 'Coupon deleted');
    })(req, res, next);
  }
}

export default new StaffAdminController();