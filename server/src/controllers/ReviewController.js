import BaseRepository from '../repositories/BaseRepository.js';
import Review from '../models/Review.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

class ReviewController {
  constructor() {
    this.repo = new BaseRepository(Review);
  }

  async forRestaurant(req, res, next) {
    asyncHandler(async () => {
      const reviews = await this.repo.find(
        { restaurant: req.params.restaurantId, isApproved: true },
        { sort: { createdAt: -1 }, limit: 40, populate: [{ path: 'customer', select: 'name avatarUrl' }] }
      );
      return ApiResponse.send(res, 200, reviews);
    })(req, res, next);
  }

  async forMenuItem(req, res, next) {
    asyncHandler(async () => {
      const reviews = await this.repo.find(
        { menuItem: req.params.menuItemId, isApproved: true },
        { sort: { createdAt: -1 }, limit: 40, populate: [{ path: 'customer', select: 'name avatarUrl' }] }
      );
      return ApiResponse.send(res, 200, reviews);
    })(req, res, next);
  }
}

export default new ReviewController();