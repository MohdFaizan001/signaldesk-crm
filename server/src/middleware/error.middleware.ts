import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { isProduction } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { sendError } from '../utils/response.js';

export const notFoundHandler: RequestHandler = (req, res) => {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    const errors = error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
    return sendError(res, 400, 'Invalid request data', errors);
  }

  if (error instanceof ApiError) {
    return res.status(error.status).json({
      success: false,
      message: error.message,
      errors: error.errors,
      ...(error.code ? { code: error.code } : {}),
    });
  }

  // PostgREST / database errors should never leak internals in production.
  const message = isProduction
    ? 'An unexpected error occurred'
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred';

  if (!isProduction) {
    console.error('[SignalDesk API error]', error);
  }

  return sendError(res, 500, message);
};
