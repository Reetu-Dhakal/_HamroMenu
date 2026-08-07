import kitchenService from '../services/KitchenService.js';
import orderService from '../services/OrderService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

class KitchenController {
  async queue(req, res, next) {
    asyncHandler(async () => {
      const queue = await kitchenService.queue(req.params.restaurantId);
      return ApiResponse.send(res, 200, queue);
    })(req, res, next);
  }

  async stats(req, res, next) {
    asyncHandler(async () => {
      const stats = await kitchenService.stats(req.params.restaurantId);
      return ApiResponse.send(res, 200, stats);
    })(req, res, next);
  }

  async accept(req, res, next) {
    asyncHandler(async () => {
      const order = await kitchenService.accept(req.params.orderId, req.user);
      return ApiResponse.send(res, 200, order, 'Order accepted');
    })(req, res, next);
  }

  async readyOrder(req, res, next) {
    asyncHandler(async () => {
      const order = await kitchenService.readyOrder(req.params.orderId, req.user);
      return ApiResponse.send(res, 200, order, 'Order marked ready');
    })(req, res, next);
  }

  async markItemReady(req, res, next) {
    asyncHandler(async () => {
      const order = await kitchenService.markItemReady(req.params.orderId, req.params.itemId, req.user);
      return ApiResponse.send(res, 200, order, 'Item marked ready');
    })(req, res, next);
  }
}

export default new KitchenController();