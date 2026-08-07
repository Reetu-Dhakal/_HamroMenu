import cartService from '../services/CartService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

class CartController {
  async getCart(req, res, next) {
    asyncHandler(async () => {
      const cart = await cartService.getCart(req.user._id, req.params.restaurantId);
      return ApiResponse.send(res, 200, cart);
    })(req, res, next);
  }

  async addItem(req, res, next) {
    asyncHandler(async () => {
      const cart = await cartService.addItem(req.user._id, req.params.restaurantId, req.body);
      return ApiResponse.send(res, 200, cart, 'Item added to cart');
    })(req, res, next);
  }

  async updateItem(req, res, next) {
    asyncHandler(async () => {
      const cart = await cartService.updateItem(req.user._id, req.params.restaurantId, req.params.itemId, req.body);
      return ApiResponse.send(res, 200, cart, 'Cart updated');
    })(req, res, next);
  }

  async removeItem(req, res, next) {
    asyncHandler(async () => {
      const cart = await cartService.removeItem(req.user._id, req.params.restaurantId, req.params.itemId);
      return ApiResponse.send(res, 200, cart, 'Item removed');
    })(req, res, next);
  }

  async clear(req, res, next) {
    asyncHandler(async () => {
      const cart = await cartService.clear(req.user._id, req.params.restaurantId);
      return ApiResponse.send(res, 200, cart, 'Cart cleared');
    })(req, res, next);
  }

  async applyCoupon(req, res, next) {
    asyncHandler(async () => {
      const result = await cartService.applyCoupon(req.user._id, req.params.restaurantId, req.body.code);
      return ApiResponse.send(res, 200, result, 'Coupon applied');
    })(req, res, next);
  }

  async removeCoupon(req, res, next) {
    asyncHandler(async () => {
      const cart = await cartService.removeCoupon(req.user._id, req.params.restaurantId);
      return ApiResponse.send(res, 200, cart, 'Coupon removed');
    })(req, res, next);
  }
}

export default new CartController();