import { Hono } from 'hono';
import { z } from 'zod';
import { AppBindings } from '..';
import { getPrisma } from '../lib/db';

export const tasks = new Hono<AppBindings>();

// Zod schema for validation
const taskSchema = z.object({
  title: z.string().min(1),
  status: z.string().optional(),
  dueDate: z.string().optional(),
});

// GET /tasks - fetch all tasks
tasks.get('/', async (c) => {
      const db = getPrisma(c.env.DATABASE_URL)

    
  const allTasks = await db.task.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return c.json(allTasks);
});

// GET /tasks/:id - fetch single task
// tasks.get('/:id', async (c) => {
    
//     const id = c.req.param('id');
//     const db = getPrisma(c.env.DATABASE_URL)
//   const task = await db.task.findUnique({ where: { id } });

//   if (!task) return c.notFound();

//   return c.json(task);
// });

// // POST /tasks - create a new task
// tasks.post('/', async (c) => {
//     const db = getPrisma(c.env.DATABASE_URL)

//   const body = await c.req.json();
//   const result = taskSchema.safeParse(body);

//   if (!result.success) {
//     return c.json({ error: result.error.flatten() }, 400);
//   }

//   const newTask = await db.task.create({
//     data: {
//       title: result.data.title,
//       status: 'PENDING',
//       dueDate: result.data.dueDate ? new Date(result.data.dueDate) : undefined,
//     },
//   });

//   return c.json(newTask);
// });

// PUT /tasks/:id - update a task
// tasks.put('/:id', async (c) => {
//     const db = getPrisma(c.env.DATABASE_URL)

//   const id = c.req.param('id');
//   const body = await c.req.json();
//   const result = taskSchema.partial().safeParse(body);

//   if (!result.success) {
//     return c.json({ error: result.error.flatten() }, 400);
//   }

//   const updated = await db.task.update({
//     where: { id },
//     data: result.data,
//   });

//   return c.json(updated);
// });

// DELETE /tasks/:id - delete a task
tasks.delete('/:id', async (c) => {
    const db = getPrisma(c.env.DATABASE_URL)

  const id = c.req.param('id');

  await db.task.delete({ where: { id } });

  return c.json({ success: true });
});
