# Take-Home: Tasks REST API

> **⚠️ Confidential — property of Ebix Inc.**
> This is a candidate evaluation project, provided to you solely for our interview
> process. Please keep it private: do **not** share, publish, or post it (or your
> solution) anywhere public (e.g. public GitHub/GitLab repos, gists, forums, social
> media) or redistribute it to anyone. When you submit, send it directly to your
> Ebix contact only. By working on this you agree to keep its contents confidential.

Welcome, and thanks for taking the time to work on this. This is a small **Tasks
REST API** built with **Express + TypeScript**, persisted to a **JSON file**
(zero native dependencies — installs anywhere). The project already runs — your
job is to complete the parts marked `// TODO(candidate):`.

We're interested in how you think, structure code, handle errors, and test —
not in clever tricks. Aim for clean, readable, production-minded code.

> ⏱️ **Time expectation:** ~2–4 hours. If you run out of time, that's fine — leave
> notes about what you'd do next.

---

## Tech stack

- **Node.js** (18+), **Express**, **TypeScript**
- **JSON file** persistence via Node's built-in `fs` (no DB server, no native modules)
- **Zod** for input validation
- **Jest** + **Supertest** for tests

> **Language note:** The scaffold is TypeScript, which we'd prefer. If you're far
> more comfortable in plain JavaScript, you may convert it — but keep the same
> structure and quality bar.

---

## Getting started

```bash
npm install
cp .env.example .env      # optional; defaults work out of the box
npm run dev               # starts the API on http://localhost:3001
```

Quick smoke test (in another terminal):

```bash
curl http://localhost:3001/health
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"My first task"}'
```

Run the tests:

```bash
npm test
```

You'll see a few **passing** tests and a block of **skipped** tests
(`describe.skip`) describing behaviour you need to implement.

---

## The data model

A `Task` looks like this:

```ts
{
  id: string;            // generated
  title: string;         // required, 1–200 chars
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  dueDate: string | null; // ISO-8601
  createdAt: string;      // ISO-8601
  updatedAt: string;      // ISO-8601
}
```

---

## Your tasks

Search the codebase for `TODO(candidate)` to find every spot that needs work.

1. **Finish the CRUD endpoints**
   - `GET /api/tasks/:id` — return one task, `404` if not found.
   - `PUT` (or `PATCH`) `/api/tasks/:id` — partial update, `404` if not found.
   - `DELETE /api/tasks/:id` — remove a task, return `204`.
   - Files: `src/controllers/tasks.controller.ts`, `src/services/tasks.service.ts`.

2. **Complete the repository** (`src/repositories/jsonFile.repository.ts`)
   - Implement `findById`, `update`, `delete` (load/save to disk is provided).

3. **List endpoint: filtering + search** (`JsonFileTaskRepository.list`)
   - Pagination (`?page=`, `?limit=`) is already wired; add the `?status=` filter
     and `?q=` free-text search over title/description, keeping `total` correct.

4. **Input validation & error handling**
   - Define `updateTaskSchema` in `src/models/task.model.ts`.
   - Ensure validation errors return `400` and missing resources return `404`,
     using the consistent `{ error: { message, details? } }` shape.

5. **Tests** (`tests/tasks.test.ts`)
   - Switch the `describe.skip` block to `describe` and make the tests pass.
   - Add a couple of your own (e.g. search, edge cases).

### Bonus (only if you have time)

- Enforce **status transition rules** (e.g. a `done` task can't go back to `todo`).
- Sort the list by `dueDate`, then `createdAt`.
- Add request logging or rate limiting.

---

## What we're looking for

- **Correctness** — endpoints behave as described; tests pass.
- **Code quality** — clear naming, small functions, sensible structure, types.
- **Error handling** — proper status codes, no unhandled rejections, no leaking internals.
- **Data layer** — safe queries, accurate pagination.
- **Testing** — meaningful coverage of happy and error paths.

---

## Submitting

1. Make sure `npm install`, `npm run dev`, and `npm test` work from a clean clone.
2. **Delete `node_modules/`** and any `tasks.json` data file.
3. Zip the folder (or run `git bundle create submission.bundle --all`) and **email
   it back to us**.
4. Include a short note: what you finished, any trade-offs, and what you'd do with
   more time.

Good luck — we're excited to see your work!
