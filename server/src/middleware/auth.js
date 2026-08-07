import authService from '../services/AuthService.js';
import ApiError, { ErrorCodes } from '../utils/ApiError.js';

export const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'Not authenticated', null, ErrorCodes.UNAUTHORIZED);
    const { user } = await authService.verifyAccess(token);
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) {
      const { user } = await authService.verifyAccess(token);
      req.user = user;
    }
    next();
  } catch (err) {
    next();
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'Not authenticated', null, ErrorCodes.UNAUTHORIZED));
  if (!req.user.hasRole(...roles))
    return next(new ApiError(403, 'You do not have permission to perform this action', null, ErrorCodes.FORBIDDEN));
  next();
};