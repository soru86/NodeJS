import { z } from 'zod';

/**
 * The canonical Task shape returned by the API.
 */
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string | null; // ISO-8601 date string, or null
  createdAt: string; // ISO-8601 timestamp
  updatedAt: string; // ISO-8601 timestamp
}

export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

/**
 * Validation schema for creating a task (POST /api/tasks).
 * This is provided as a working example of how we validate input with zod.
 */
export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'title is required').max(200),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(TASK_STATUSES).optional(), // defaults to "todo" in the service
  dueDate: z.string().datetime().optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

// TODO(candidate): Define `updateTaskSchema` for PUT/PATCH /api/tasks/:id.
//   - All fields should be optional (partial update), but at least one must be present.
//   - Reuse the field rules above where possible (hint: createTaskSchema.partial()).
export const updateTaskSchema = z.object({
  // TODO(candidate): fill this in.
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

/**
 * Query parameters for GET /api/tasks (filtering + pagination).
 * Provided so you can wire it into the controller/service.
 */
export const listTasksQuerySchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  q: z.string().trim().optional(), // free-text search over title/description
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
