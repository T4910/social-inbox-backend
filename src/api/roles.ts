import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { AppBindings } from "..";
import { getPrisma } from "../lib/db";

const createRolesSchema = z.object({
  name: z.string(),
  description: z.string(),
  permissions: z.array(
    z.object({
      resource: z.enum(["tasks", "users", "roles"]),
      action: z.enum(["create", "read", "update", "delete"]),
    })
  ),
});

const updateRolesSchema = z.object({
  id: z.string(),
  name: z.string(),
  permissions: z.array(
    z.object({
      resource: z.enum(["tasks", "users", "roles"]),
      action: z.enum(["create", "read", "update", "delete"]),
    })
  ),
});

export const roles = new Hono<AppBindings>();

roles.get("/", async (c) => {
  const db = getPrisma(c.env.DATABASE_URL);

  const roles = await db.roles.findMany({
    include: { permissions: true },
  });

  return c.json({ data: roles, status: 200, ok: true }, 200);
});

roles.post("/", zValidator("json", createRolesSchema), async (c) => {
  const db = getPrisma(c.env.DATABASE_URL);

  const role = c.req.valid("json");
  console.log(role);

  const newRole = await db.roles.create({
    include: { permissions: true },
    data: {
      name: role.name,
      description: role.description,
      permissions: {
        create: role.permissions.map((permission) => ({
          resource: permission.resource,
          action: permission.action,
        })),
      },
    },
  });

  return c.json({ data: newRole, status: 201, ok: true }, 201);
});

roles.put("/:id", zValidator("json", updateRolesSchema), async (c) => {
  const db = getPrisma(c.env.DATABASE_URL);

  const id = c.req.param("id");
  const role = c.req.valid("json");

  const updated = await db.roles.update({
    where: { id },
    include: { permissions: true },
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

  return c.json({ data: updated, status: 200, ok: true }, 200);
});

roles.delete("/:id", async (c) => {
  const db = getPrisma(c.env.DATABASE_URL);

  const id = c.req.param("id");

  await db.roles.delete({
    where: { id },
  });

  return c.json(
    { message: "Role deleted successfully", status: 200, ok: true },
    200
  );
});
