import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';

export function errorHandler(err, req, res, next) {
  // Operational errors
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    const formatted = err.issues?.map((i) => ({ field: i.path.join('.'), message: i.message })) || err.errors;
    return sendError(res, 400, 'VALIDATION_ERROR', 'Input validation failed', formatted);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return sendError(res, 400, 'VALIDATION_ERROR', err.message, details);
  }

  // Mongoose duplicate key error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return sendError(res, 409, 'DUPLICATE_KEY', `${field} already exists.`);
  }

  // Mongoose invalid ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return sendError(res, 400, 'INVALID_ID', `Invalid identifier format for ${err.path}`);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'INVALID_TOKEN', 'Authentication token is invalid.');
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'TOKEN_EXPIRED', 'Authentication token has expired.');
  }

  console.error('[Unhandled Error]', err);
  return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred.');
}
