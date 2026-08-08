import staffService from '../services/StaffService.js';
import orderService from '../services/OrderService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

class StaffController {
  async dashboard(req, res, next) {
    asyncHandler(async () => {
      const data = await staffService.dashboard(req.params.restaurantId, req.user._id);
      return ApiResponse.send(res, 200, data);
    })(req, res, next);
  }

  async activeOrders(req, res, next) {
    asyncHandler(async () => {
      const data = await orderService.listForRestaurant(req.params.restaurantId, req.query);
      return ApiResponse.send(res, 200, data);
    })(req, res, next);
  }

  async confirm(req, res, next) {
    asyncHandler(async () => {
      const order = await orderService.confirmOrder(req.params.orderId, req.user);
      return ApiResponse.send(res, 200, order, 'Order confirmed');
    })(req, res, next);
  }

  async sendToKitchen(req, res, next) {
    asyncHandler(async () => {
      const order = await staffService.sendToKitchen(req.params.orderId, req.user);
      return ApiResponse.send(res, 200, order, 'Sent to kitchen');
    })(req, res, next);
  }

  async serveFood(req, res, next) {
    asyncHandler(async () => {
      const order = await staffService.serveOrder(req.params.orderId, req.user);
      return ApiResponse.send(res, 200, order, 'Order served');
    })(req, res, next);
  }

  async bill(req, res, next) {
    asyncHandler(async () => {
      const bill = await staffService.generateBill(req.params.orderId);
      return ApiResponse.send(res, 200, bill, 'Bill generated');
    })(req, res, next);
  }

  async collectCash(req, res, next) {
    asyncHandler(async () => {
      const result = await staffService.collectCash(req.params.orderId, req.user._id);
      return ApiResponse.send(res, 200, result, 'Payment collected');
    })(req, res, next);
  }

  async tables(req, res, next) {
    asyncHandler(async () => {
      const tables = await staffService.tablesWithOrders(req.params.restaurantId);
      return ApiResponse.send(res, 200, tables);
    })(req, res, next);
  }
}

export default new StaffController();