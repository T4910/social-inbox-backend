import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { AppBindings } from "..";
import { getPrisma } from "../lib/db";

const users = new Hono<AppBindings>();

const updateUserSchema = z.object({
  user: z.object({
    name: z.string(),
    email: z.string(),
  }),
  role: z.object({
    name: z.string(),
  }),
});

// Get all users
users.get("/", async (c) => {
  const db = getPrisma(c.env.DATABASE_URL);
  try {
    const users = await db.user.findMany({ include: { roles: true } });
    return c.json({ data: users, status: 200, ok: true }, 200);
  } catch (error) {
    return c.json(
      { message: "Failed to fetch users", ok: false, status: 500 },
      500
    );
  }
});

// Get a user by ID
users.get("/:id", async (c) => {
  const db = getPrisma(c.env.DATABASE_URL);

  const id = c.req.param("id");
  try {
    const user = await db.user.findUnique({
      where: { id },
      include: { roles: true },
    });
    if (!user) {
      return c.json({ message: "User not found", ok: true, status: 404 }, 404);
    }
    return c.json(user);
  } catch (error) {
    return c.json({ message: `Failed to fetch user ${error}` }, 500);
  }
});

// // Create a new user
// users.post('/',
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
users.put("/:id", zValidator("json", updateUserSchema), async (c) => {
  const db = getPrisma(c.env.DATABASE_URL);

  const id = c.req.param("id");
  const body = c.req.valid("json");
  console.log(body);

  try {
    const updatedUser = await db.user.update({
      where: { id },
      include: { roles: true },
      data: { ...body },
    });
    return c.json({ data: updatedUser, status: 200, ok: true }, 200);
  } catch (error) {
    return c.json({ message: "Failed to update user", status: 500 }, 500);
  }
});

// Delete a user by ID
users.delete("/:id", async (c) => {
  const db = getPrisma(c.env.DATABASE_URL);

  const id = c.req.param("id");
  try {
    await db.user.delete({ where: { id } });
    return c.json(
      { message: "User deleted successfully", ok: true, status: 200 },
      200
    );
  } catch (error) {
    return c.json(
      { message: "Failed to delete user", ok: true, status: 500 },
      500
    );
  }
});

export default users;
