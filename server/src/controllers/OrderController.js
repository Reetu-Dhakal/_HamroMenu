import orderService from '../services/OrderService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

class OrderController {
  async placeOrder(req, res, next) {
    asyncHandler(async () => {
      const order = await orderService.placeOrder(req.user._id, {
        restaurantId: req.params.restaurantId,
        tableId: req.body.tableId,
        notes: req.body.notes,
        customerNote: req.body.customerNote,
        specialRequests: req.body.specialRequests,
        paymentMethod: req.body.paymentMethod,
        source: req.body.source,
      });
      return ApiResponse.send(res, 201, order, 'Order placed');
    })(req, res, next);
  }

  async getById(req, res, next) {
    asyncHandler(async () => {
      const order = req.user?.hasRole('customer')
        ? await orderService.getForCustomer(req.params.id, req.user._id)
        : await orderService.getById(req.params.id);
      return ApiResponse.send(res, 200, order);
    })(req, res, next);
  }

  async myHistory(req, res, next) {
    asyncHandler(async () => {
      const data = await orderService.history(req.user._id, req.query);
      return ApiResponse.send(res, 200, data);
    })(req, res, next);
  }

  async listForRestaurant(req, res, next) {
    asyncHandler(async () => {
      const data = await orderService.listForRestaurant(req.params.restaurantId, req.query);
      return ApiResponse.send(res, 200, data);
    })(req, res, next);
  }

  async activeOrderForTable(req, res, next) {
    asyncHandler(async () => {
      const order = await orderService.activeOrderForTable(req.params.tableId);
      return ApiResponse.send(res, 200, order || null);
    })(req, res, next);
  }

  async cancel(req, res, next) {
    asyncHandler(async () => {
      const order = await orderService.cancelOrder(req.params.id, req.user, req.body.reason);
      return ApiResponse.send(res, 200, order, 'Order cancelled');
    })(req, res, next);
  }

  async updateStatus(req, res, next) {
    asyncHandler(async () => {
      const order = await orderService.changeStatus(req.params.id, req.body.status, req.user, req.body.note);
      return ApiResponse.send(res, 200, order, 'Order status updated');
    })(req, res, next);
  }
}

export default new OrderController();