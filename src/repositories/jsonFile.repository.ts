import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { Task } from '../models/task.model';
import {
  ListOptions,
  ListResult,
  NewTaskData,
  TaskRepository,
  UpdateTaskData,
} from './task.repository';

/**
 * A simple file-backed TaskRepository.
 *
 * Data lives in an in-memory Map and is persisted to a JSON file after each
 * mutation (and loaded from it on startup). Pass `filePath = null` for a
 * pure in-memory store with no file I/O — that's what the tests use.
 *
 * Persistence (load/save) is handled internally; mutations call persist().
 */
export class JsonFileTaskRepository implements TaskRepository {
  private tasks = new Map<string, Task>();

  constructor(private readonly filePath: string | null) {
    this.load();
  }

  /** Loads tasks from disk into memory (no-op for in-memory mode). */
  private load(): void {
    if (!this.filePath || !existsSync(this.filePath)) return;
    try {
      const raw = readFileSync(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw) as Task[];
      for (const task of parsed) this.tasks.set(task.id, task);
    } catch {
      // Corrupt/empty file — start fresh rather than crash.
    }
  }

  /** Persists the current in-memory state to disk (no-op for in-memory mode). */
  private persist(): void {
    if (!this.filePath) return;
    const all = [...this.tasks.values()];
    writeFileSync(this.filePath, JSON.stringify(all, null, 2), 'utf-8');
  }

  // ---- Reference implementation: create -------------------------------------
  async create(data: NewTaskData): Promise<Task> {
    const now = new Date().toISOString();
    const task: Task = {
      id: randomUUID(),
      title: data.title,
      description: data.description,
      status: data.status,
      dueDate: data.dueDate,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(task.id, task);
    this.persist();
    return task;
  }

  async list(options: ListOptions): Promise<ListResult> {
    let matches = [...this.tasks.values()];

    if (options.status) {
      matches = matches.filter((task) => task.status === options.status);
    }

    if (options.q) {
      const query = options.q.toLowerCase();
      matches = matches.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          (task.description?.toLowerCase().includes(query) ?? false)
      );
    }

    matches.sort((a, b) => {
      if (a.dueDate === null && b.dueDate === null) {
        return a.createdAt.localeCompare(b.createdAt);
      }
      if (a.dueDate === null) return 1;
      if (b.dueDate === null) return -1;
      const byDueDate = a.dueDate.localeCompare(b.dueDate);
      if (byDueDate !== 0) return byDueDate;
      return a.createdAt.localeCompare(b.createdAt);
    });

    const total = matches.length;
    const start = (options.page - 1) * options.limit;
    const items = matches.slice(start, start + options.limit);
    return { items, total };
  }

  async findById(id: string): Promise<Task | null> {
    return this.tasks.get(id) ?? null;
  }

  async update(id: string, data: UpdateTaskData): Promise<Task | null> {
    const existing = this.tasks.get(id);
    if (!existing) return null;

    const updated: Task = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(id, updated);
    this.persist();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const removed = this.tasks.delete(id);
    if (removed) this.persist();
    return removed;
  }
}
