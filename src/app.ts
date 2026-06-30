import express, { Application } from 'express';
import { TasksController } from './controllers/tasks.controller';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { createRateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import { JsonFileTaskRepository } from './repositories/jsonFile.repository';
import { createTasksRouter } from './routes/tasks.routes';
import { TasksService } from './services/tasks.service';

export interface AppOptions {
  /** Path to the JSON data file, or null for a pure in-memory store. */
  dataFile: string | null;
  /** Log method, path, status, and duration for each request. Defaults off in test. */
  requestLogging?: boolean;
  /** Per-IP rate limit. Pass `false` to disable. Defaults off in test. */
  rateLimit?: false | { windowMs: number; max: number };
}

const DEFAULT_RATE_LIMIT = {
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
};

/**
 * Builds the Express app and wires the dependency chain:
 *   repository -> service -> controller -> router.
 *
 * Exported as a factory so tests can spin up an app with an in-memory store.
 */
export function createApp(options: AppOptions): Application {
  const { dataFile } = options;
  const isTest = process.env.NODE_ENV === 'test';
  const requestLogging = options.requestLogging ?? !isTest;
  const rateLimit =
    options.rateLimit === false
      ? null
      : (options.rateLimit ?? (isTest ? null : DEFAULT_RATE_LIMIT));

  const app = express();
  app.use(express.json());

  if (requestLogging) {
    app.use(requestLogger);
  }
  if (rateLimit) {
    app.use(createRateLimiter(rateLimit));
  }

  // Composition root.
  const repository = new JsonFileTaskRepository(dataFile);
  const service = new TasksService(repository);
  const controller = new TasksController(service);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/tasks', createTasksRouter(controller));

  // 404 + error handling must be registered last.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
