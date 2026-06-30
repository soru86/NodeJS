import { Request, Response } from 'express';
import { createRateLimiter } from '../src/middleware/rateLimiter';

function mockResponse() {
  return {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;
}

describe('createRateLimiter', () => {
  it('falls back to unknown client key when IP is missing', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
    const req = { socket: {} } as Request;
    const next = jest.fn();
    const res = mockResponse();

    limiter(req, res, next);
    limiter(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Too many requests, please try again later' },
    });
  });
});
