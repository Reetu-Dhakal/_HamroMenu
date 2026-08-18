import ApiError from '../utils/ApiError.js';
import { USER_ROLES } from '../models/UserBase.js';

export const ensureRestaurantContext = (req, res, next) => {
  if (req.user.role === 'super_admin') return next();
  if (!req.user.restaurant) {
    return next(new ApiError(403, 'User is not associated with a restaurant'));
  }
  const ctxRestaurant = req.user.restaurant.toString();
  const paramRestaurant = req.params.restaurantId?.toString();

  if (paramRestaurant && ctxRestaurant !== paramRestaurant) {
    return next(new ApiError(403, 'Access denied to this restaurant - restaurant context mismatch'));
  }

  next();
};

export const ensureStaffContext = (req, res, next) => {
  if (req.user.role === 'super_admin') return next();
  if (req.user.role === 'admin' && req.user.restaurant) return next();
  if (!req.user.restaurant) {
    return next(new ApiError(403, 'Staff must be associated with a restaurant'));
  }
  next();
};

export const ensureKitchenContext = (req, res, next) => {
  if (req.user.role === 'super_admin') return next();
  if (req.user.role === 'admin' && req.user.restaurant) return next();
  if (!req.user.restaurant) {
    return next(new ApiError(403, 'Kitchen staff must be associated with a restaurant'));
  }
  next();
};