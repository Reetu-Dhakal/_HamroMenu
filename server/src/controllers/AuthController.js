import { body, query } from 'express-validator';
import authService from '../services/AuthService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { ApiResponse } from '../utils/ApiResponse.js';

class AuthController {
  registerCustomerRules() {
    return [
      body('name').isString().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
      body('email').isEmail().withMessage('A valid email is required'),
      body('phone').optional().isString(),
      body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
      validate,
    ];
  }

  async registerCustomer(req, res, next) {
    asyncHandler(async () => {
      const payload = await authService.registerCustomer(req.body);
      return ApiResponse.send(res, 201, payload, 'Account created successfully');
    })(req, res, next);
  }

  async login(req, res, next) {
    asyncHandler(async () => {
      const payload = await authService.login(req.body.email, req.body.password);
      return ApiResponse.send(res, 200, payload, 'Logged in successfully');
    })(req, res, next);
  }

  async refresh(req, res, next) {
    asyncHandler(async () => {
      const payload = await authService.refresh(req.body.refreshToken);
      return ApiResponse.send(res, 200, payload, 'Token refreshed');
    })(req, res, next);
  }

  async logout(req, res, next) {
    asyncHandler(async () => {
      await authService.logout(req.user);
      return ApiResponse.send(res, 200, null, 'Logged out');
    })(req, res, next);
  }

  async me(req, res, next) {
    asyncHandler(async () => {
      return ApiResponse.send(res, 200, req.user.toSafeJSON(), 'Current user');
    })(req, res, next);
  }

  async forgotPassword(req, res, next) {
    asyncHandler(async () => {
      const result = await authService.requestPasswordReset(req.body.email);
      return ApiResponse.send(res, 200, result, 'Password reset link generated');
    })(req, res, next);
  }

  async resetPassword(req, res, next) {
    asyncHandler(async () => {
      await authService.resetPassword(req.body.token, req.body.password);
      return ApiResponse.send(res, 200, null, 'Password reset successfully');
    })(req, res, next);
  }
}

export default new AuthController();