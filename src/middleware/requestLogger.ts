import { NextFunction, Request, Response } from 'express';

/**
 * Logs each completed request: method, path, status code, and duration.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const timestamp = new Date().toISOString();
    // eslint-disable-next-line no-console
    console.log(
      `${req.method} : [${timestamp}] - [${req.originalUrl}] ${res.statusCode} ${durationMs}ms`
    );
  });

  next();
}
