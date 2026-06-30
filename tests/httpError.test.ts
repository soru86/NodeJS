import { badRequest, notFound } from '../src/utils/httpError';

describe('httpError helpers', () => {
  it('notFound uses the default message', () => {
    const err = notFound();
    expect(err.status).toBe(404);
    expect(err.message).toBe('Resource not found');
  });

  it('badRequest uses the default message', () => {
    const err = badRequest();
    expect(err.status).toBe(400);
    expect(err.message).toBe('Bad request');
  });
});
