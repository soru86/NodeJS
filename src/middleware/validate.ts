import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

/**
 * Optional helper: validate a request section against a zod schema and replace
 * it with the parsed (typed/coerced) value. Throws a ZodError on failure, which
 * the central error handler turns into a 400.
 *
 * The reference controllers parse inline with `schema.parse(...)`, but you're
 * welcome to use this middleware instead, e.g.:
 *   router.post('/', validate(createTaskSchema, 'body'), controller.create)
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (req as any)[source] = parsed;
      next();
    } catch (err) {
      next(err);
    }
  };
}
