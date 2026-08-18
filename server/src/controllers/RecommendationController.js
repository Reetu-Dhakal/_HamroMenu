import recommendationService from '../services/RecommendationService.js';
import FeatureGateService from '../services/FeatureGateService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

class RecommendationController {
  async personalized(req, res, next) {
    asyncHandler(async () => {
      const { restaurantId } = req.params;

      // Check if restaurant's plan includes KNN recommendations
      const hasRecs = await FeatureGateService.hasRecommendations(restaurantId);
      if (!hasRecs) {
        // Fallback: return bestsellers / popular items instead of personalized KNN
        const fallback = await recommendationService.recommendedFor(
          restaurantId,
          req.user?._id || null,
          { limit: 8, fallback: true }
        );
        return ApiResponse.send(res, 200, { ...fallback, type: 'popular-fallback' });
      }

      const limit = Math.min(Number(req.query.limit) || 8, 12);
      const result = await recommendationService.recommendedFor(
        restaurantId,
        req.user?._id || null,
        { limit }
      );
      return ApiResponse.send(res, 200, result);
    })(req, res, next);
  }

  async companions(req, res, next) {
    asyncHandler(async () => {
      const { restaurantId } = req.params;
      const items = String(req.query.items || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const limit = Math.min(Number(req.query.limit) || 6, 8);

      // Check if restaurant's plan includes Apriori "frequently ordered together"
      const hasApriori = await FeatureGateService.hasApriori(restaurantId);
      if (!hasApriori) {
        return ApiResponse.send(res, 200, { rules: [], message: 'Apriori not available on your plan' });
      }

      const result = await recommendationService.companionFor(restaurantId, items, { limit });
      return ApiResponse.send(res, 200, result);
    })(req, res, next);
  }

  async rebuild(req, res, next) {
    asyncHandler(async () => {
      const { restaurantId } = req.params;
      const cache = await recommendationService.rebuild(restaurantId);
      return ApiResponse.send(res, 200, cache, 'Recommendation cache rebuilt');
    })(req, res, next);
  }

  async stats(req, res, next) {
    asyncHandler(async () => {
      const { restaurantId } = req.params;
      const stats = await recommendationService.statsFor(restaurantId);
      return ApiResponse.send(res, 200, stats);
    })(req, res, next);
  }
}

export default new RecommendationController();