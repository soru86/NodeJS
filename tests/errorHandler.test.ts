import { Request, Response } from 'express';
import { ZodError, z } from 'zod';
import { errorHandler } from '../src/middleware/errorHandler';
import { badRequest, notFound } from '../src/utils/httpError';

function mockResponse() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as Response & { statusCode: number; body: unknown };
}

describe('errorHandler', () => {
  it('formats ZodError as 400 with details', () => {
    const res = mockResponse();
    let caught: ZodError | undefined;
    try {
      z.object({ title: z.string().min(1) }).parse({ title: '' });
    } catch (err) {
      caught = err as ZodError;
    }

    errorHandler(caught, {} as Request, res, jest.fn());

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      error: { message: 'Validation failed', details: expect.any(Object) },
    });
  });

  it('formats HttpError with optional details', () => {
    const res = mockResponse();

    errorHandler(
      badRequest('Invalid input', { field: 'title' }),
      {} as Request,
      res,
      jest.fn()
    );

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: { message: 'Invalid input', details: { field: 'title' } },
    });
  });

  it('formats HttpError without details', () => {
    const res = mockResponse();

    errorHandler(notFound('Task missing'), {} as Request, res, jest.fn());

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: { message: 'Task missing' } });
  });

  it('returns 500 for unexpected errors', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = mockResponse();

    errorHandler(new Error('boom'), {} as Request, res, jest.fn());

    expect(errorSpy).toHaveBeenCalledWith('Unhandled error:', expect.any(Error));
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: { message: 'Internal server error' } });
    errorSpy.mockRestore();
  });
});
