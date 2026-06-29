// @ts-ignore
/**
 * A small error type that carries an HTTP status code. Throw this from the
 * service/controller layer and the central error handler will translate it into
 * a consistent JSON response.
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFound = (message = 'Resource not found') =>
  new HttpError(404, message);

export const badRequest = (message = 'Bad request', details?: unknown) =>
  new HttpError(400, message, details);
