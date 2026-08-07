import ApiError from '../utils/ApiError.js';

export const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, _next) => {
  let error = err;

  if (err?.name === 'ValidationError' && err.errors) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    error = new ApiError(400, 'Validation failed', details, 'VALIDATION_ERROR');
  }

  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    error = new ApiError(409, `Duplicate value for ${field}`, null, 'CONFLICT');
  }

  if (err?.name === 'CastError') {
    error = new ApiError(400, `Invalid ${err.path}: ${err.value}`, null, 'VALIDATION_ERROR');
  }

  if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Invalid or expired token', null, 'UNAUTHORIZED');
  }

  const status = error.statusCode || 500;
  res.status(status).json({
    success: false,
    statusCode: status,
    message: error.message || 'Internal server error',
    code: error.code || (status >= 500 ? 'INTERNAL' : 'ERROR'),
    details: error.details || undefined,
    stack: process.env.NODE_ENV === 'development' && status >= 500 ? error.stack : undefined,
  });
};