import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { AppBindings } from "..";
import { getPrisma } from "../lib/db";
import { getUserInfoFromToken } from "../middleware/authMiddleware";

export const tasks = new Hono<AppBindings>();

// Zod schema for validation
const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "REVIEW", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  assigneeId: z.string().optional(),
  createdById: z.string(),
  dueDate: z.string().optional(),
  comment: z
    .array(
      z.object({
        userId: z.string(),
        content: z.string(),
      })
    )
    .optional(),
});

const updateTaskSchemea = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "REVIEW", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  assigneeId: z.string().optional(),
  createdById: z.string(),
  dueDate: z.string().optional(),
  comment: z
    .array(
      z.object({
        userId: z.string(),
        content: z.string(),
      })
    )
    .optional(),
});

const createCommentSchema = z.object({
  userId: z.string(),
  content: z.string(),
});

// GET /tasks - fetch all tasks
tasks.get("/", async (c) => {
  const db = getPrisma(c.env.DATABASE_URL);
  const userId = c.req.query("assigneeId");

  const allTasks = userId
    ? await db.task.findMany({
        where: { assigneeId: userId },
        orderBy: { createdAt: "desc" },
      })
    : await db.task.findMany({});

  return c.json({ data: allTasks, status: 200, ok: true });
});

// GET /tasks/:id - fetch single task
tasks.get("/:id", async (c) => {
  const id = c.req.param("id");
  const db = getPrisma(c.env.DATABASE_URL);
  const task = await db.task.findUnique({ where: { id } });

  if (!task) return c.notFound();

  return c.json({ data: task, status: 200, ok: true });
});

// POST /tasks - create a new task
tasks.post(
  "/",
  zValidator(
    "json",
    z.object({
      body: createTaskSchema,
    })
  ),
  async (c) => {
    const db = getPrisma(c.env.DATABASE_URL);
    const { body } = c.req.valid("json");

    const newTask = await db.task.create({
      data: {
        ...body,
        comments: {
          create:
            body.comment?.map((comment) => ({
              userId: comment.userId,
              content: comment.content,
            })) || [],
        },
      },
    });

    return c.json({ data: newTask, status: 200, ok: true });
  }
);

// PUT /tasks/:id - update a task
tasks.put(
  "/:id",
  zValidator(
    "json",
    z.object({
      body: updateTaskSchemea,
    })
  ),
  async (c) => {
    const db = getPrisma(c.env.DATABASE_URL);

    const id = c.req.param("id");
    const { body } = c.req.valid("json");

    // taskWithoutComments
    const newTask = await db.task.update({
      where: { id },
      data: {
        ...body,
      },
    });

    return c.json({ data: newTask, status: 200, ok: true });
  }
);

// DELETE /tasks/:id - delete a task
tasks.delete("/:id", async (c) => {
  const db = getPrisma(c.env.DATABASE_URL);

  const id = c.req.param("id");

  await db.task.delete({ where: { id } });

  return c.json({ success: true });
});

// POST /tasks/:id/comments - add a comment to a task
tasks.post(
  "/:id/comments",
  zValidator(
    "json",
    z.object({
      body: createCommentSchema,
    })
  ),
  async (c) => {
    const db = getPrisma(c.env.DATABASE_URL);
    const id = c.req.param("id");
    const { body } = c.req.valid("json");

    const newComment = await db.taskComment.create({
      data: {
        taskId: id,
        userId: body.userId,
        content: body.content,
      },
    });

    return c.json({ data: newComment, status: 200, ok: true });
  }
);

// GET /tasks/:id/comments - get all comments for a task
tasks.get("/:id/comments", async (c) => {
  const db = getPrisma(c.env.DATABASE_URL);
  const id = c.req.param("id");

  const comments = await db.taskComment.findMany({
    where: { taskId: id },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ data: comments, status: 200, ok: true });
});

// DELETE /tasks/:id/comments/:commentId - delete a comment from a task
tasks.delete("/:id/comments/:commentId", async (c) => {
  const db = getPrisma(c.env.DATABASE_URL);
  const id = c.req.param("id");
  const commentId = c.req.param("commentId");

  await db.taskComment.delete({ where: { id: commentId } });

  return c.json({ message: "delete successfully", ok: true });
});
