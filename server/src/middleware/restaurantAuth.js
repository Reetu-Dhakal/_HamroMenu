import ApiError from '../utils/ApiError.js';
import { USER_ROLES } from '../models/UserBase.js';

export const ensureRestaurantContext = (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'Not authenticated'));
  if (req.user.role === 'super_admin') return next();
  // Customers are platform-wide (they may order from many restaurants).
  // Ownership is enforced at the service level (customer+cart/order),
  // so do not require a restaurant link for them.
  if (req.user.role === 'customer') return next();
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
  if ((req.user.role === 'admin' || req.user.role === 'manager') && req.user.restaurant) return next();
  if (!req.user.restaurant) {
    return next(new ApiError(403, 'Staff must be associated with a restaurant'));
  }
  next();
};

export const ensureKitchenContext = (req, res, next) => {
  if (req.user.role === 'super_admin') return next();
  if ((req.user.role === 'admin' || req.user.role === 'manager') && req.user.restaurant) return next();
  if (!req.user.restaurant) {
    return next(new ApiError(403, 'Kitchen staff must be associated with a restaurant'));
  }
  next();
};

/**
 * Assert that a restaurant-scoped document belongs to the actor's restaurant.
 * Super admins bypass. Customers are platform-wide (they may order from many
 * restaurants) so this check only applies to restaurant users
 * (admin/manager/staff/kitchen).
 * Throws ApiError(403) on cross-tenant access.
 */
export const assertSameRestaurant = (actor, docRestaurantId, message = 'Access denied to this restaurant') => {
  if (!actor) throw new ApiError(401, 'Not authenticated');
  if (actor.role === 'super_admin') return;
  if (actor.role === 'customer') return; // customers use customer+order ownership checks instead
  const actorRestaurant = actor.restaurant?.toString?.() || String(actor.restaurant || '');
  if (!actorRestaurant) throw new ApiError(403, 'User is not associated with a restaurant');
  if (String(docRestaurantId) !== actorRestaurant) {
    throw new ApiError(403, message);
  }
};

/** Express middleware version: validates req.params.restaurantId against user. */
export const ensureOwnsRestaurantParam = (req, _res, next) => {
  try {
    if (req.user.role === 'super_admin') return next();
    if (req.user.role === 'customer') return next(); // handled by ownership checks
    assertSameRestaurant(req.user, req.params.restaurantId);
    return next();
  } catch (err) {
    return next(err);
  }
};

/**
 * Order-level tenant guard for staff/kitchen routes that address an order
 * directly (POST /staff/orders/:orderId/*, POST /kitchen/orders/:orderId/*).
 * Verifies the order's restaurant matches the actor's restaurant.
 */
export const ensureOrderBelongsToRestaurant = async (req, _res, next) => {
  try {
    if (!req.user) return next(new ApiError(401, 'Not authenticated'));
    if (req.user.role === 'super_admin') return next();
    const { default: Order } = await import('../models/Order.js');
    const order = await Order.findById(req.params.orderId).select('restaurant customer');
    if (!order) return next(new ApiError(404, 'Order not found'));
    if (req.user.role === 'customer') {
      if (order.customer.toString() !== req.user._id.toString()) {
        return next(new ApiError(403, 'Access denied to this order'));
      }
      return next();
    }
    assertSameRestaurant(req.user, order.restaurant, 'Access denied to this order');
    return next();
  } catch (err) {
    return next(err);
  }
};