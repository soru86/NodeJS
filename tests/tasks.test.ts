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

  it('POST /api/tasks rejects an empty title with 400', async () => {
    const res = await request(app).post('/api/tasks').send({ title: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Validation failed');
  });
});

/**
 * The tests below describe behaviour you need to make work by completing the
 * TODOs in the repository / service / controller.
 *
 * TODO(candidate): Change `describe.skip` to `describe` and implement the
 * features until these pass. Add more of your own where useful.
 */
describe.skip('Tasks API — TODO(candidate): implement these', () => {
  it('GET /api/tasks lists tasks with pagination metadata', async () => {
    await request(app).post('/api/tasks').send({ title: 'A' });
    await request(app).post('/api/tasks').send({ title: 'B' });

    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toMatchObject({ page: 1, total: 2 });
  });

  it('GET /api/tasks?status=done filters by status', async () => {
    await request(app).post('/api/tasks').send({ title: 'A', status: 'todo' });
    await request(app).post('/api/tasks').send({ title: 'B', status: 'done' });

    const res = await request(app).get('/api/tasks?status=done');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('B');
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

  it('DELETE /api/tasks/:id removes a task', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'A' });
    const id = created.body.data.id;

    const del = await request(app).delete(`/api/tasks/${id}`);
    expect(del.status).toBe(204);

    const after = await request(app).get(`/api/tasks/${id}`);
    expect(after.status).toBe(404);
  });

  // TODO(candidate): add tests for free-text search (?q=) and for the bonus
  // status-transition rules if you implement them.
});
