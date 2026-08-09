import paymentService from '../services/PaymentService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

class PaymentController {
  async init(req, res, next) {
    asyncHandler(async () => {
      const data = await paymentService.initPayment({
        orderId: req.params.orderId,
        method: req.body.method,
        customerId: req.user._id,
      });
      return ApiResponse.send(res, 200, data, 'Payment initialized');
    })(req, res, next);
  }

  async esewaStart(req, res, next) {
    asyncHandler(async () => {
      const data = await paymentService.esewaStart({ orderId: req.params.orderId, customerId: req.user._id });
      return ApiResponse.send(res, 200, data, 'eSewa payment prepared');
    })(req, res, next);
  }

  async payAfterMeal(req, res, next) {
    asyncHandler(async () => {
      const result = await paymentService.payAfterMeal({ orderId: req.params.orderId, customerId: req.user._id });
      return ApiResponse.send(res, 200, result, 'Payment deferred to after meal');
    })(req, res, next);
  }

  async verifyEsewa(req, res, next) {
    asyncHandler(async () => {
      const payment = await paymentService.verifyEsewa({
        paymentId: req.params.paymentId,
        refId: req.body.refId,
        transactionId: req.body.transactionId,
        oid: req.body.oid,
        amt: req.body.amt,
        signature: req.body.signature,
      });
      return ApiResponse.send(res, 200, payment, 'Payment verified');
    })(req, res, next);
  }

  async verifyKhalti(req, res, next) {
    asyncHandler(async () => {
      const result = await paymentService.verifyKhalti(req.params.paymentId, req.body.token);
      return ApiResponse.send(res, 200, result, result.success ? 'Payment verified' : 'Verification pending');
    })(req, res, next);
  }

  async markCash(req, res, next) {
    asyncHandler(async () => {
      const payment = await paymentService.markCashPaid(req.params.paymentId, req.user._id);
      return ApiResponse.send(res, 200, payment, 'Payment recorded');
    })(req, res, next);
  }

  async forOrder(req, res, next) {
    asyncHandler(async () => {
      const payment = await paymentService.getForOrder(req.params.orderId);
      return ApiResponse.send(res, 200, payment);
    })(req, res, next);
  }

  async listForRestaurant(req, res, next) {
    asyncHandler(async () => {
      const data = await paymentService.listForRestaurant(req.params.restaurantId, req.query);
      return ApiResponse.send(res, 200, data);
    })(req, res, next);
  }
}

export default new PaymentController();