import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../utils/httpError';

/**
 * Central error handler. Produces a consistent error response shape:
 *   { error: { message: string, details?: unknown } }
 *
 * - ZodError      -> 400 with field-level issues
 * - HttpError     -> its own status code
 * - anything else -> 500
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        details: err.flatten(),
      },
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: {
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  // Unexpected error: log it server-side, return a generic 500.
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  return res.status(500).json({
    error: { message: 'Internal server error' },
  });
}

/** 404 handler for unmatched routes. */
export function notFoundHandler(
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction) {
  res.status(404).json({ error: { message: 'Route not found' } });
}
