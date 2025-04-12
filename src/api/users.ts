import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { AppBindings } from '..';
import { getPrisma } from '../lib/db';

const users = new Hono<AppBindings>();

const updateUserSchema = z.object({
    user: z.object({
        name: z.string(),
        email: z.string(),
    }),
    role: z.object({
        name: z.string(),
    })
})

// Get all users
users.get('/users', async (c) => {
    const db = getPrisma(c.env.DATABASE_URL);
    try {
        const users = await db.user.findMany({ include: { roles: true } });
        return c.json(users);
    } catch (error) {
        return c.json({ error: 'Failed to fetch users' }, 500);
    }
});

// Get a user by ID
users.get('/users/:id', async (c) => {
    const db = getPrisma(c.env.DATABASE_URL);

    const id = c.req.param('id');
    try {
        const user = await db.user.findUnique({ where: { id }, include: { roles: true } });
        if (!user) {
            return c.json({ error: 'User not found' }, 404);
        }
        return c.json(user);
    } catch (error) {
        return c.json({ error: 'Failed to fetch user' }, 500);
    }
});

// // Create a new user
// users.post('/users', 
//     zValidator('json', z.object({
//         body: z.object(updateUserSchema)
//     })),
//     async (c) => {
//     const db = getPrisma(c.env.DATABASE_URL);

//     const body = await c.req.json();
//     try {
//         const newUser = await db.user.create({ data: body });
//         return c.json(newUser, 201);
//     } catch (error) {
//         return c.json({ error: 'Failed to create user' }, 500);
//     }
// });

// Update a user by ID
users.put('/users/:id', 
        zValidator('json', z.object({
        body: updateUserSchema
    })),
    async (c) => {
    const db = getPrisma(c.env.DATABASE_URL);

    const id = c.req.param('id');
    const { body } = c.req.valid('json');
        console.log(body)

    try {
        const updatedUser = await db.user.update({
            where: { id },
            include: { roles: true },
            data: {...body},
        });
        return c.json({data: updatedUser, status:  200, ok: true}, 200);
    } catch (error) {
        return c.json({ error: 'Failed to update user', status: 500 }, 500);
    }
});

// Delete a user by ID
users.delete('/users/:id', async (c) => {
    const db = getPrisma(c.env.DATABASE_URL);

    const id = c.req.param('id');
    try {
        await db.user.delete({ where: { id } });
        return c.json({ message: 'User deleted successfully', ok: true, status: 200 }, 200);
    } catch (error) {
        return c.json({ error: 'Failed to delete user', ok: true, status: 500 }, 500);
    }
});

export default users;