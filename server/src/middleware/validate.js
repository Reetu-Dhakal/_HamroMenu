import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

export const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({ field: e.path || e.param, message: e.msg }));
    return next(new ApiError(400, 'Validation failed', details, 'VALIDATION_ERROR'));
  }
  next();
};

export const RULES = {
  email: ['isEmail'],
  password: (min = 6) => ['isString', { fn: (v) => v.length >= min, msg: `Password must be at least ${min} characters` }],
  name: ['isString', { fn: (v) => v.trim().length >= 2, msg: 'Name must be at least 2 characters' }],
};