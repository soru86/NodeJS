import { Router } from 'express';
import { TasksController } from '../controllers/tasks.controller';

/**
 * Wires task endpoints to controller handlers.
 * GET (list) and POST (create) are done; the rest are stubbed for you to finish.
 */
export function createTasksRouter(controller: TasksController): Router {
  const router = Router();

  router.get('/', controller.list);
  router.post('/', controller.create);

  // These routes are wired for you, but their controller handlers are stubbed.
  // TODO(candidate): implement getById / update / remove in tasks.controller.ts.
  // (You may switch PUT to PATCH or add both if you prefer partial updates.)
  router.get('/:id', controller.getById);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);

  return router;
}
