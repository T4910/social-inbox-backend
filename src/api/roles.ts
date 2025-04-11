import { Hono } from 'hono';
import { z } from 'zod';
import { AppBindings } from '..';
import { getPrisma } from '../lib/db';
// import { checkRole } from '../middleware/rbac';

export const roles = new Hono<AppBindings>();

// Only ADMINs should be allowed to access these routes
// roles.use('*', checkRole(['ADMIN']));

// Get list of all users with roles
roles.get('/roles', async (c) => {
          const db = getPrisma(c.env.DATABASE_URL)
    
  const roles = await db.roles.findMany({
    include: { permissions: true },
  });

  return c.json(roles);
});

// 
// roles.put('/roles/:id/', async (c) => {
//   const id = c.req.param('id');
//   const body = await c.req.json();
//   const result = roleSchema.safeParse(body);

//   if (!result.success) {
//     return c.json({ error: result.error.flatten() }, 400);
//   }

//   const updated = await db.user.update({
//     where: { id },
//     data: { role: result.data.role },
//   });

//   return c.json(updated);
// });
