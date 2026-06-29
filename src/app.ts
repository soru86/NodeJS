import express, { Application } from 'express';
import { TasksController } from './controllers/tasks.controller';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { JsonFileTaskRepository } from './repositories/jsonFile.repository';
import { createTasksRouter } from './routes/tasks.routes';
import { TasksService } from './services/tasks.service';

export interface AppOptions {
  /** Path to the JSON data file, or null for a pure in-memory store. */
  dataFile: string | null;
}

/**
 * Builds the Express app and wires the dependency chain:
 *   repository -> service -> controller -> router.
 *
 * Exported as a factory so tests can spin up an app with an in-memory store.
 */
export function createApp({ dataFile }: AppOptions): Application {
  const app = express();
  app.use(express.json());

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
