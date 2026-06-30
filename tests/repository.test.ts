import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { createApp } from '../src/app';

const seededTask = {
  id: '11111111-1111-1111-1111-111111111111',
  title: 'From disk',
  description: null,
  status: 'todo' as const,
  dueDate: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('JsonFileTaskRepository — file persistence', () => {
  let tempDir: string;
  let dataFile: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'tasks-api-test-'));
    dataFile = join(tempDir, 'tasks.json');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('loads tasks from an existing JSON file on startup', async () => {
    writeFileSync(dataFile, JSON.stringify([seededTask], null, 2));
    const app = createApp({ dataFile, rateLimit: false });

    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('From disk');
  });

  it('persists mutations to disk and reloads them in a new app instance', async () => {
    const app = createApp({ dataFile, rateLimit: false });
    await request(app).post('/api/tasks').send({ title: 'Saved to disk' });

    const onDisk = JSON.parse(readFileSync(dataFile, 'utf-8'));
    expect(onDisk).toHaveLength(1);
    expect(onDisk[0].title).toBe('Saved to disk');

    const reloadedApp = createApp({ dataFile, rateLimit: false });
    const res = await request(reloadedApp).get('/api/tasks');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Saved to disk');
  });

  it('starts fresh when the data file is corrupt', async () => {
    writeFileSync(dataFile, 'not-json{{{');
    const app = createApp({ dataFile, rateLimit: false });

    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});
