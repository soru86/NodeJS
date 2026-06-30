import { NextFunction, Request, Response } from 'express';
import {
  createTaskSchema,
  listTasksQuerySchema,
  updateTaskSchema,
} from '../models/task.model';
import { TasksService } from '../services/tasks.service';

/**
 * HTTP layer: parse/validate the request, call the service, shape the response.
 * Errors are passed to `next(err)` so the central error handler can format them.
 */
export class TasksController {
  constructor(private readonly service: TasksService) { }

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

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await this.service.getById(req.params.id);
      res.json({ data: task });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = updateTaskSchema.parse(req.body);
      const task = await this.service.update(req.params.id, input);
      res.json({ data: task });
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.remove(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
