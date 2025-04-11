import { Hono } from 'hono';
import { AppBindings } from '..';
import { users } from '../../data';
import { getPrisma } from '../lib/db';
// import { checkRole } from '../middleware/rbac';

export const seed = new Hono<AppBindings>();

seed.get('/', async (c) => {
    const db = getPrisma(c.env.DATABASE_URL)


    // creating permissions
    await db.permissions.createMany(
        {
            data: [
                { resource: "tasks", action: "create" },
                { resource: "tasks", action: "read" },
                { resource: "tasks", action: "update" },
                { resource: "tasks", action: "delete" },
                { resource: "users", action: "create" },
                { resource: "users", action: "read" },
                { resource: "users", action: "update" },
                { resource: "users", action: "delete" },
                { resource: "roles", action: "create" },
                { resource: "roles", action: "read" },
                { resource: "roles", action: "update" },
                { resource: "roles", action: "delete" },
            ]
        }
    )
    const perms = await db.permissions.findMany({
        where: {
            OR: [
                { resource: "tasks" },
                { resource: "users" },
                { resource: "roles" },
            ]
        }
    })


    const adminRole = await db.roles.create({
        data: {
            name: "Administrator",
            description: "Full access to all resources",
            permissions: {
                connect: perms.map(p => ({ id: p.id }))
            }
        }
    })

    const editorRole = await db.roles.create({
        data: {
            name: "Editor",
            description: "Can create and edit tasks and projects",
            permissions: {
                connect: perms.filter(p => p.resource === "tasks").map(p => ({ id: p.id }))
            }
        }
    })

    const viewer = await db.roles.create({
        data: {
            name: "Viewer",
            description: "Read-only access to tasks and projects",
            permissions: {
                connect: perms.filter(p => p.resource === "tasks" && p.action === "read").map(p => ({ id: p.id }))
            }
        }
    })

    await db.user.create({
        data: {
            email: "admin@taiwo.com",
            password: "user.password", // Store the hashed password
            roles: {
                connect: { id: adminRole.id } // Connect to the default role
            }
        }
    })
    
    const editor = await db.user.create({
        data: {
            email: "editor@taiwo.com",
            password: "user.password", // Store the hashed password
            roles: {
                connect: { id: editorRole.id } // Connect to the default role
            }
        }
    })

    await db.user.createMany({
        data: users.map(user => ({
            email: user.email,
            password: user.password,
        }))
    })

    await db.task.createMany({
        data: [
            {
                title: "Task 1",
                description: "Description for Task 1",
                status: "PENDING",
                priority: "LOW",
                dueDate: new Date(),
                assigneeId: viewer.id,
                createdById: editor.id,
            },
            {
                title: "Task 2",
                description: "Description for Task 2",
                status: "DONE",
                priority: "LOW",
                dueDate: new Date(),
                assigneeId: viewer.id,
                createdById: editor.id,

            },
        ]
    })

    return c.json({ message: "Seeded successfully" });


})