import BaseRepository from '../repositories/BaseRepository.js';
import Review from '../models/Review.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const repo = new BaseRepository(Review);

class ReviewController {
  async forRestaurant(req, res, next) {
    asyncHandler(async () => {
      const reviews = await repo.find(
        { restaurant: req.params.restaurantId, isApproved: true },
        { sort: { createdAt: -1 }, limit: 40, populate: [{ path: 'customer', select: 'name avatarUrl' }] }
      );
      return ApiResponse.send(res, 200, reviews);
    })(req, res, next);
  }

  async forMenuItem(req, res, next) {
    asyncHandler(async () => {
      const reviews = await repo.find(
        { menuItem: req.params.menuItemId, isApproved: true },
        { sort: { createdAt: -1 }, limit: 40, populate: [{ path: 'customer', select: 'name avatarUrl' }] }
      );
      return ApiResponse.send(res, 200, reviews);
    })(req, res, next);
  }

  async adminList(req, res, next) {
    asyncHandler(async () => {
      const { restaurantId } = req.params;
      const filter = { restaurant: restaurantId };
      if (req.query.status === 'pending') filter.isApproved = false;
      if (req.query.status === 'approved') filter.isApproved = true;
      const reviews = await repo.find(filter, {
        sort: { createdAt: -1 },
        populate: [
          { path: 'customer', select: 'name email avatarUrl' },
          { path: 'menuItem', select: 'name' },
          { path: 'order', select: 'orderNumber' },
        ],
      });
      return ApiResponse.send(res, 200, reviews);
    })(req, res, next);
  }

  async adminSetApproved(req, res, next) {
    asyncHandler(async () => {
      const review = await repo.findByIdAndUpdate(req.params.id, { isApproved: req.body.isApproved === true }, { new: true });
      if (!review) throw new ApiError(404, 'Review not found', null, 'NOT_FOUND');
      return ApiResponse.send(res, 200, review, req.body.isApproved ? 'Review published' : 'Review removed');
    })(req, res, next);
  }

  async adminDelete(req, res, next) {
    asyncHandler(async () => {
      await repo.findByIdAndDelete(req.params.id);
      return ApiResponse.send(res, 200, null, 'Review deleted');
    })(req, res, next);
  }
}

export default new ReviewController();