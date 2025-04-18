import { Hono } from "hono";
import { AppBindings } from "..";
import { users } from "../../data";
import { getPrisma } from "../lib/db";
// import { checkRole } from '../middleware/rbac';

export const seed = new Hono<AppBindings>();

seed.get("/", async (c) => {
  const db = getPrisma(c.env.DATABASE_URL);

  // creating permissions
  await db.permissions.createMany({
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
    ],
  });

  return c.json({ message: "Seeded successfully" });
});
