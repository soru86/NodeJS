import {
  CreateTaskInput,
  ListTasksQuery,
  Task,
  TaskStatus,
  UpdateTaskInput,
} from '../models/task.model';
import {
  ListResult,
  TaskRepository,
} from '../repositories/task.repository';
import { badRequest, notFound } from '../utils/httpError';

const ALLOWED_STATUS_TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  todo: ['in_progress', 'done'],
  in_progress: ['todo', 'done'],
  done: [],
};

function assertValidStatusTransition(from: TaskStatus, to: TaskStatus): void {
  if (from === to) return;
  if (!ALLOWED_STATUS_TRANSITIONS[from].includes(to)) {
    throw badRequest(`Invalid status transition from ${from} to ${to}`);
  }
}

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

  async list(query: ListTasksQuery): Promise<ListResult> {
    return this.repo.list({
      status: query.status,
      q: query.q,
      page: query.page,
      limit: query.limit,
    });
  }

  async getById(id: string): Promise<Task> {
    const task = await this.repo.findById(id);
    if (!task) throw notFound(`Task ${id} not found`);
    return task;
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const existing = await this.repo.findById(id);
    if (!existing) throw notFound(`Task ${id} not found`);

    if (input.status !== undefined) {
      assertValidStatusTransition(existing.status, input.status);
    }

    const task = await this.repo.update(id, input);
    if (!task) throw notFound(`Task ${id} not found`);
    return task;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.repo.delete(id);
    if (!removed) throw notFound(`Task ${id} not found`);
  }
}
