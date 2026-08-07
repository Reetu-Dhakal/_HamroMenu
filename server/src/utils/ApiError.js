export class ApiError extends Error {
  constructor(statusCode, message, details = null, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
    this.isOperational = true;
  }
}

export const ErrorCodes = {
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  CART_EMPTY: 'CART_EMPTY',
  INVALID_COUPON: 'INVALID_COUPON',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
};

export default ApiError;