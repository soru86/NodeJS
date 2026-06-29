import {
  CreateTaskInput,
  ListTasksQuery,
  Task,
  UpdateTaskInput,
} from '../models/task.model';
import {
  ListResult,
  TaskRepository,
} from '../repositories/task.repository';
import { notFound } from '../utils/httpError';

/**
 * Business logic for tasks. The service depends on the TaskRepository interface,
 * not a concrete database, so it can be unit-tested with a fake repository.
 */
export class TasksService {
  constructor(private readonly repo: TaskRepository) {}

  // ---- Reference implementation: create -------------------------------------
  async create(input: CreateTaskInput): Promise<Task> {
    return this.repo.create({
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? 'todo',
      dueDate: input.dueDate ?? null,
    });
  }

  // ---- TODO(candidate): list ------------------------------------------------
  async list(query: ListTasksQuery): Promise<ListResult> {
    // TODO(candidate): Translate the validated query into repository ListOptions
    // and return the result. Keep pagination metadata intact.
    return this.repo.list({
      status: query.status,
      q: query.q,
      page: query.page,
      limit: query.limit,
    });
  }

  // ---- TODO(candidate): getById ---------------------------------------------
  async getById(id: string): Promise<Task> {
    // TODO(candidate): Return the task, or throw `notFound()` if it doesn't exist.
    const task = await this.repo.findById(id);
    if (!task) throw notFound(`Task ${id} not found`);
    return task;
  }

  // ---- TODO(candidate): update ----------------------------------------------
  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    // TODO(candidate): Apply the update via the repository. Throw `notFound()`
    // if the task does not exist. (Bonus: enforce status transition rules.)
    throw new Error('Not implemented: TasksService.update');
  }

  // ---- TODO(candidate): remove ----------------------------------------------
  async remove(id: string): Promise<void> {
    // TODO(candidate): Delete the task. Throw `notFound()` if it didn't exist.
    throw new Error('Not implemented: TasksService.remove');
  }
}
