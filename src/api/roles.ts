import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { AppBindings } from '..';
import { getPrisma } from '../lib/db';
// import { checkRole } from '../middleware/rbac';

const createRolesSchema = {
  role: z.object({
      name: z.string(),
      description: z.string(),
      permissions: z.array(z.object({
          resource: z.enum(['tasks', 'projects', 'users', 'roles']),
          action: z.enum(['create', 'read', 'update', 'delete']),
      })),
  })
}

const updateRolesSchema = {
  role: z.object({
      id: z.string(),
      name: z.string(),
      permissions: z.array(z.object({
          resource: z.enum(['tasks', 'projects', 'users', 'roles']),
          action: z.enum(['create', 'read', 'update', 'delete']),
      })),
  })
}

export const roles = new Hono<AppBindings>();

roles.get('/roles', async (c) => {
          const db = getPrisma(c.env.DATABASE_URL)
    
  const roles = await db.roles.findMany({
    include: { permissions: true },
  });

  return c.json({data: roles, status: 200, ok: true}, 200);
});

roles.post('/roles',
  zValidator('json', z.object({
    body: z.object(createRolesSchema)
  })),
  async (c) => {
  const db = getPrisma(c.env.DATABASE_URL)

  const {body: {role}} = c.req.valid('json');


  const newRole = await db.roles.create({
    data: {
      name: role.name,
      description: role.description,
      permissions: {
        create: role.permissions.map((permission) => ({
          resource: permission.resource,
          action: permission.action,
        })),
      },
    }
  });

  return c.json(newRole, 201);
})


roles.put('/roles/:id/', 
  zValidator('json', z.object({
    body: z.object(updateRolesSchema)
  })),
  async (c) => {
  const db = getPrisma(c.env.DATABASE_URL)

  const id = c.req.param('id');
  const {body: {role}} = c.req.valid('json');

  const updated = await db.roles.update({
    where: { id },
    data: { 
      name: role.name,
      permissions: {
        deleteMany: {}, // Delete existing permissions
        create: role.permissions.map((permission) => ({
          resource: permission.resource,
          action: permission.action,
        })),
      },
     },
  });

  return c.json({data: updated, status: 200, ok: true}, 200);
});
