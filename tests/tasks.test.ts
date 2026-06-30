import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../src/app';

/**
 * Tests run against a pure in-memory store (dataFile: null) so each run starts
 * clean and nothing is written to disk.
 */
let app: Application;

beforeEach(() => {
  app = createApp({ dataFile: null });
});

describe('Tasks API — provided (passing) tests', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('POST /api/tasks creates a task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Write the report' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      title: 'Write the report',
      status: 'todo',
      description: null,
    });
    expect(res.body.data.id).toEqual(expect.any(String));
    expect(res.body.data.createdAt).toEqual(expect.any(String));
  });

  it('POST /api/tasks accepts optional fields', async () => {
    const res = await request(app).post('/api/tasks').send({
      title: 'Full task',
      description: 'Details here',
      status: 'in_progress',
      dueDate: '2026-08-01T12:00:00.000Z',
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      title: 'Full task',
      description: 'Details here',
      status: 'in_progress',
      dueDate: '2026-08-01T12:00:00.000Z',
    });
  });

  it('POST /api/tasks rejects an empty title with 400', async () => {
    const res = await request(app).post('/api/tasks').send({ title: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Validation failed');
  });

  it('GET unknown route returns 404 via notFoundHandler', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Route not found');
  });
});

describe('Tasks API — CRUD, filtering, and validation', () => {
  it('GET /api/tasks lists tasks with pagination metadata', async () => {
    await request(app).post('/api/tasks').send({ title: 'A' });
    await request(app).post('/api/tasks').send({ title: 'B' });

    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toMatchObject({ page: 1, total: 2 });
  });

  it('GET /api/tasks supports page and limit', async () => {
    await request(app).post('/api/tasks').send({ title: 'A' });
    await request(app).post('/api/tasks').send({ title: 'B' });
    await request(app).post('/api/tasks').send({ title: 'C' });

    const res = await request(app).get('/api/tasks?page=2&limit=1');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination).toMatchObject({
      page: 2,
      limit: 1,
      total: 3,
      totalPages: 3,
    });
  });

  it('GET /api/tasks rejects invalid query params with 400', async () => {
    const res = await request(app).get('/api/tasks?status=not-a-status');
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Validation failed');
  });

  it('GET /api/tasks?status=done filters by status', async () => {
    await request(app).post('/api/tasks').send({ title: 'A', status: 'todo' });
    await request(app).post('/api/tasks').send({ title: 'B', status: 'done' });

    const res = await request(app).get('/api/tasks?status=done');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('B');
  });

  it('GET /api/tasks combines status filter and search', async () => {
    await request(app)
      .post('/api/tasks')
      .send({ title: 'Done report', status: 'done' });
    await request(app)
      .post('/api/tasks')
      .send({ title: 'Todo report', status: 'todo' });
    await request(app)
      .post('/api/tasks')
      .send({ title: 'Done other', status: 'done' });

    const res = await request(app).get('/api/tasks?status=done&q=report');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Done report');
    expect(res.body.pagination.total).toBe(1);
  });

  it('GET /api/tasks/:id returns a single task', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'A' });
    const id = created.body.data.id;

    const res = await request(app).get(`/api/tasks/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(id);
  });

  it('GET /api/tasks/:id returns 404 for an unknown id', async () => {
    const res = await request(app).get('/api/tasks/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('PUT /api/tasks/:id updates a task', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'A' });
    const id = created.body.data.id;

    const res = await request(app)
      .put(`/api/tasks/${id}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('in_progress');
  });

  it('PATCH /api/tasks/:id partially updates a task', async () => {
    const created = await request(app).post('/api/tasks').send({
      title: 'Original',
      description: 'Keep me',
    });
    const id = created.body.data.id;

    const res = await request(app)
      .patch(`/api/tasks/${id}`)
      .send({ title: 'Patched title' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      title: 'Patched title',
      description: 'Keep me',
      status: 'todo',
    });
  });

  it('PATCH /api/tasks/:id returns 404 for an unknown id', async () => {
    const res = await request(app)
      .patch('/api/tasks/does-not-exist')
      .send({ title: 'Nope' });
    expect(res.status).toBe(404);
  });

  it('PUT /api/tasks/:id allows updating with the same status', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'A' });
    const id = created.body.data.id;

    const res = await request(app)
      .put(`/api/tasks/${id}`)
      .send({ status: 'todo', title: 'Renamed' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ title: 'Renamed', status: 'todo' });
  });

  it('PUT /api/tasks/:id can clear description and dueDate', async () => {
    const created = await request(app).post('/api/tasks').send({
      title: 'With extras',
      description: 'Notes',
      dueDate: '2026-08-01T12:00:00.000Z',
    });
    const id = created.body.data.id;

    const res = await request(app)
      .put(`/api/tasks/${id}`)
      .send({ description: null, dueDate: null });

    expect(res.status).toBe(200);
    expect(res.body.data.description).toBeNull();
    expect(res.body.data.dueDate).toBeNull();
  });

  it('DELETE /api/tasks/:id removes a task', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'A' });
    const id = created.body.data.id;

    const del = await request(app).delete(`/api/tasks/${id}`);
    expect(del.status).toBe(204);

    const after = await request(app).get(`/api/tasks/${id}`);
    expect(after.status).toBe(404);
  });

  it('GET /api/tasks?q= searches title and description', async () => {
    await request(app)
      .post('/api/tasks')
      .send({ title: 'Buy groceries', description: 'Milk and eggs' });
    await request(app)
      .post('/api/tasks')
      .send({ title: 'Write report', description: 'Quarterly summary' });

    const byTitle = await request(app).get('/api/tasks?q=groceries');
    expect(byTitle.status).toBe(200);
    expect(byTitle.body.data).toHaveLength(1);
    expect(byTitle.body.data[0].title).toBe('Buy groceries');
    expect(byTitle.body.pagination.total).toBe(1);

    const byDescription = await request(app).get('/api/tasks?q=quarterly');
    expect(byDescription.status).toBe(200);
    expect(byDescription.body.data).toHaveLength(1);
    expect(byDescription.body.data[0].title).toBe('Write report');
  });

  it('PUT /api/tasks/:id rejects an empty body with 400', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'A' });
    const id = created.body.data.id;

    const res = await request(app).put(`/api/tasks/${id}`).send({});
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Validation failed');
  });

  it('PUT /api/tasks/:id returns 404 for an unknown id', async () => {
    const res = await request(app)
      .put('/api/tasks/does-not-exist')
      .send({ status: 'done' });
    expect(res.status).toBe(404);
  });

  it('DELETE /api/tasks/:id returns 404 for an unknown id', async () => {
    const res = await request(app).delete('/api/tasks/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Task does-not-exist not found');
  });

  it('GET /api/tasks sorts by dueDate then createdAt', async () => {
    await request(app)
      .post('/api/tasks')
      .send({ title: 'Later due', dueDate: '2026-07-15T00:00:00.000Z' });
    await request(app)
      .post('/api/tasks')
      .send({ title: 'Earlier due', dueDate: '2026-07-01T00:00:00.000Z' });
    await request(app).post('/api/tasks').send({ title: 'No due date' });
    await request(app)
      .post('/api/tasks')
      .send({ title: 'Same due later', dueDate: '2026-07-01T00:00:00.000Z' });

    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.data.map((t: { title: string }) => t.title)).toEqual([
      'Earlier due',
      'Same due later',
      'Later due',
      'No due date',
    ]);
  });

  it('PUT /api/tasks/:id rejects invalid status transitions', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .send({ title: 'Finish me', status: 'todo' });
    const id = created.body.data.id;

    await request(app).put(`/api/tasks/${id}`).send({ status: 'done' });

    const backToTodo = await request(app)
      .put(`/api/tasks/${id}`)
      .send({ status: 'todo' });
    expect(backToTodo.status).toBe(400);
    expect(backToTodo.body.error.message).toBe(
      'Invalid status transition from done to todo'
    );

    const backToInProgress = await request(app)
      .put(`/api/tasks/${id}`)
      .send({ status: 'in_progress' });
    expect(backToInProgress.status).toBe(400);
    expect(backToInProgress.body.error.message).toBe(
      'Invalid status transition from done to in_progress'
    );
  });

  it('PUT /api/tasks/:id allows valid status transitions', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .send({ title: 'Workflow task' });
    const id = created.body.data.id;

    const toInProgress = await request(app)
      .put(`/api/tasks/${id}`)
      .send({ status: 'in_progress' });
    expect(toInProgress.status).toBe(200);
    expect(toInProgress.body.data.status).toBe('in_progress');

    const backToTodo = await request(app)
      .put(`/api/tasks/${id}`)
      .send({ status: 'todo' });
    expect(backToTodo.status).toBe(200);
    expect(backToTodo.body.data.status).toBe('todo');

    const toDone = await request(app)
      .put(`/api/tasks/${id}`)
      .send({ status: 'done' });
    expect(toDone.status).toBe(200);
    expect(toDone.body.data.status).toBe('done');
  });

  it('PUT /api/tasks/:id allows non-status updates on a done task', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .send({ title: 'Closed task', status: 'done' });
    const id = created.body.data.id;

    const res = await request(app)
      .put(`/api/tasks/${id}`)
      .send({ title: 'Closed task (archived)' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      title: 'Closed task (archived)',
      status: 'done',
    });
  });
});

describe('Middleware — request logging and rate limiting', () => {
  it('requestLogger logs completed requests when enabled', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const loggingApp = createApp({ dataFile: null, requestLogging: true });

    await request(loggingApp).get('/health');

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^GET \/health 200 \d+ms$/)
    );
    logSpy.mockRestore();
  });

  it('rate limiter returns 429 when the limit is exceeded', async () => {
    const limitedApp = createApp({
      dataFile: null,
      rateLimit: { windowMs: 60_000, max: 2 },
    });

    await request(limitedApp).get('/health');
    await request(limitedApp).get('/health');
    const res = await request(limitedApp).get('/health');

    expect(res.status).toBe(429);
    expect(res.body.error.message).toBe(
      'Too many requests, please try again later'
    );
    expect(res.headers['x-ratelimit-limit']).toBe('2');
    expect(res.headers['x-ratelimit-remaining']).toBe('0');
  });

  it('can disable request logging and rate limiting explicitly', async () => {
    const plainApp = createApp({
      dataFile: null,
      requestLogging: false,
      rateLimit: false,
    });

    const res = await request(plainApp).get('/health');
    expect(res.status).toBe(200);
  });
});
