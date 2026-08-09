import customerService from '../services/CustomerService.js';
import orderService from '../services/OrderService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

class CustomerController {
  async profile(req, res, next) {
    asyncHandler(async () => {
      const profile = await customerService.getProfile(req.user._id);
      return ApiResponse.send(res, 200, profile);
    })(req, res, next);
  }

  async updateProfile(req, res, next) {
    asyncHandler(async () => {
      const profile = await customerService.updateProfile(req.user._id, req.body);
      return ApiResponse.send(res, 200, profile, 'Profile updated');
    })(req, res, next);
  }

  async orders(req, res, next) {
    asyncHandler(async () => {
      const data = await orderService.history(req.user._id, req.query);
      return ApiResponse.send(res, 200, data);
    })(req, res, next);
  }

  async toggleFavorite(req, res, next) {
    asyncHandler(async () => {
      const favorites = await customerService.toggleFavorite(req.user._id, req.params.menuItemId);
      return ApiResponse.send(res, 200, favorites, 'Favorites updated');
    })(req, res, next);
  }

  async favorites(req, res, next) {
    asyncHandler(async () => {
      const favorites = await customerService.favorites(req.user._id);
      return ApiResponse.send(res, 200, favorites);
    })(req, res, next);
  }

  async addReview(req, res, next) {
    asyncHandler(async () => {
      const review = await customerService.addReview(req.user._id, {
        restaurant: req.params.restaurantId,
        order: req.body.order,
        menuItem: req.body.menuItem,
        rating: req.body.rating,
        title: req.body.title,
        comment: req.body.comment,
        tags: req.body.tags,
        images: req.body.images,
      });
      return ApiResponse.send(res, 201, review, 'Review submitted');
    })(req, res, next);
  }

  async myReviews(req, res, next) {
    asyncHandler(async () => {
      const reviews = await customerService.listMyReviews(req.user._id);
      return ApiResponse.send(res, 200, reviews);
    })(req, res, next);
  }
}

export default new CustomerController();