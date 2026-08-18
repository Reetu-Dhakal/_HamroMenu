import { body, query } from 'express-validator';
import menuService from '../services/MenuService.js';
import FeatureGateService from '../services/FeatureGateService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';

class MenuController {
  async getMenu(req, res, next) {
    asyncHandler(async () => {
      const { restaurantId } = req.params;
      const menu = await menuService.getMenu(restaurantId, {
        search: req.query.search || '',
        includeInactive: req.query.includeInactive === 'true',
        vegOnly: req.query.veg === 'true',
        spice: req.query.spice || '',
        maxPrice: Number(req.query.maxPrice) || 0,
        tag: req.query.tag || '',
      });
      return ApiResponse.send(res, 200, menu);
    })(req, res, next);
  }

  async getCategories(req, res, next) {
    asyncHandler(async () => {
      const categories = await menuService.getCategories(req.params.restaurantId);
      return ApiResponse.send(res, 200, categories);
    })(req, res, next);
  }

  createCategoryRules() {
    return [body('name').isString().notEmpty().withMessage('Category name required'), validate];
  }

  async addCategory(req, res, next) {
    asyncHandler(async () => {
      const restaurantId = req.params.restaurantId;

      // Check if restaurant's plan allows adding more categories/items
      const canAdd = await FeatureGateService.canAddMenuItem(restaurantId);
      if (!canAdd) {
        const sub = await Subscription.findOne({ restaurant: restaurantId }).populate('plan');
        const planName = sub?.plan?.name || 'unknown';
        return next(
          new ApiError(403, `Cannot add more items on ${planName} plan - upgrade your plan for unlimited menu items`)
        );
      }

      const category = await menuService.createCategory(req.params.restaurantId, req.body);
      return ApiResponse.send(res, 201, category, 'Category created');
    })(req, res, next);
  }

  async updateCategory(req, res, next) {
    asyncHandler(async () => {
      const category = await menuService.updateCategory(req.params.id, req.body);
      return ApiResponse.send(res, 200, category, 'Category updated');
    })(req, res, next);
  }

  async removeCategory(req, res, next) {
    asyncHandler(async () => {
      await menuService.deleteCategory(req.params.id);
      return ApiResponse.send(res, 200, null, 'Category deleted');
    })(req, res, next);
  }

  async addItem(req, res, next) {
    asyncHandler(async () => {
      const restaurantId = req.params.restaurantId;

      // Check if restaurant's plan allows adding more menu items
      const canAdd = await FeatureGateService.canAddMenuItem(restaurantId);
      if (!canAdd) {
        const sub = await Subscription.findOne({ restaurant: restaurantId }).populate('plan');
        const planName = sub?.plan?.name || 'unknown';
        return next(
          new ApiError(403, `Cannot add more menu items on ${planName} plan - upgrade your plan for unlimited items`)
        );
      }

      const item = await menuService.createItem(req.params.restaurantId, req.body);
      return ApiResponse.send(res, 201, item, 'Menu item created');
    })(req, res, next);
  }

  async updateItem(req, res, next) {
    asyncHandler(async () => {
      const item = await menuService.updateItem(req.params.id, req.body);
      return ApiResponse.send(res, 200, item, 'Menu item updated');
    })(req, res, next);
  }

  async removeItem(req, res, next) {
    asyncHandler(async () => {
      await menuService.deleteItem(req.params.id);
      return ApiResponse.send(res, 200, null, 'Menu item deleted');
    })(req, res, next);
  }

  async toggleAvailability(req, res, next) {
    asyncHandler(async () => {
      const item = await menuService.toggleAvailability(req.params.id, req.body.isAvailable);
      return ApiResponse.send(res, 200, item, 'Availability updated');
    })(req, res, next);
  }
}

export default new MenuController();