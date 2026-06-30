import { Router } from 'express';
import { TasksController } from '../controllers/tasks.controller';

/** Wires task endpoints to controller handlers. */
export function createTasksRouter(controller: TasksController): Router {
  const router = Router();

  router.get('/', controller.list);
  router.post('/', controller.create);
  router.get('/:id', controller.getById);
  router.put('/:id', controller.update);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.remove);

  return router;
}
