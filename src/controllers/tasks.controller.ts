import { NextFunction, Request, Response } from 'express';
import {
  createTaskSchema,
  listTasksQuerySchema,
} from '../models/task.model';
import { TasksService } from '../services/tasks.service';

/**
 * HTTP layer: parse/validate the request, call the service, shape the response.
 * Errors are passed to `next(err)` so the central error handler can format them.
 */
export class TasksController {
  constructor(private readonly service: TasksService) {}

  // ---- Reference implementation: list (GET /api/tasks) ----------------------
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = listTasksQuerySchema.parse(req.query);
      const { items, total } = await this.service.list(query);
      res.json({
        data: items,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      });
    } catch (err) {
      next(err);
    }
  };

  // ---- Reference implementation: create (POST /api/tasks) -------------------
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createTaskSchema.parse(req.body);
      const task = await this.service.create(input);
      res.status(201).json({ data: task });
    } catch (err) {
      next(err);
    }
  };

  // ---- TODO(candidate): getById (GET /api/tasks/:id) ------------------------
  getById = async (req: Request, res: Response, next: NextFunction) => {
    // TODO(candidate): Return a single task. Respond 404 (via the service's
    // notFound error) when it doesn't exist.
    next(new Error('Not implemented: TasksController.getById'));
  };

  // ---- TODO(candidate): update (PUT/PATCH /api/tasks/:id) -------------------
  update = async (req: Request, res: Response, next: NextFunction) => {
    // TODO(candidate): Validate the body with updateTaskSchema, call the
    // service, and return the updated task.
    next(new Error('Not implemented: TasksController.update'));
  };

  // ---- TODO(candidate): remove (DELETE /api/tasks/:id) ---------------------
  remove = async (req: Request, res: Response, next: NextFunction) => {
    // TODO(candidate): Delete the task and return an appropriate status
    // (e.g. 204 No Content).
    next(new Error('Not implemented: TasksController.remove'));
  };
}
