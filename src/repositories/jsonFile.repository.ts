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
 * Persistence (load/save) is provided for you. Your job is to implement the
 * data operations on top of it.
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

  // ---- Partly done: list. Pagination works; filtering/search is your TODO. --
  async list(options: ListOptions): Promise<ListResult> {
    let matches = [...this.tasks.values()];

    // TODO(candidate): apply filtering before pagination:
    //   - when options.status is set, keep only tasks with that status
    //   - when options.q is set, keep only tasks whose title OR description
    //     contains the query (case-insensitive)

    const total = matches.length;
    const start = (options.page - 1) * options.limit;
    const items = matches.slice(start, start + options.limit);
    return { items, total };
  }

  // ---- TODO(candidate): findById --------------------------------------------
  async findById(id: string): Promise<Task | null> {
    // TODO(candidate): Return the task or null if it doesn't exist.
    throw new Error('Not implemented: JsonFileTaskRepository.findById');
  }

  // ---- TODO(candidate): update ----------------------------------------------
  async update(id: string, data: UpdateTaskData): Promise<Task | null> {
    // TODO(candidate): Apply a partial update to only the provided fields, bump
    // updatedAt, persist(), and return the updated Task (or null if missing).
    throw new Error('Not implemented: JsonFileTaskRepository.update');
  }

  // ---- TODO(candidate): delete ----------------------------------------------
  async delete(id: string): Promise<boolean> {
    // TODO(candidate): Remove the task, persist(), and return whether a task
    // was actually removed.
    throw new Error('Not implemented: JsonFileTaskRepository.delete');
  }
}
