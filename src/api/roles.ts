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
  const organizationId = c.req.query("organizationId");
  if (!organizationId) {
    return c.json({
      message: "Missing organizationId",
      status: 400,
      ok: false,
    });
  }
  const roles = await db.roles.findMany({
    where: { organizationId },
    include: { permissions: true },
  });
  return c.json({ data: roles, status: 200, ok: true }, 200);
});

roles.post(
  "/",
  zValidator("json", createRolesSchema.extend({ organizationId: z.string() })),
  async (c) => {
    const db = getPrisma(c.env.DATABASE_URL);
    const role = c.req.valid("json");
    if (!role.organizationId) {
      return c.json({
        message: "Missing organizationId",
        status: 400,
        ok: false,
      });
    }
    const newRole = await db.roles.create({
      include: { permissions: true },
      data: {
        name: role.name,
        description: role.description,
        organizationId: role.organizationId,
        permissions: {
          create: role.permissions.map((permission) => ({
            resource: permission.resource,
            action: permission.action,
          })),
        },
      },
    });
    return c.json({ data: newRole, status: 201, ok: true }, 201);
  }
);

roles.put(
  "/:id",
  zValidator("json", updateRolesSchema.extend({ organizationId: z.string() })),
  async (c) => {
    const db = getPrisma(c.env.DATABASE_URL);
    const id = c.req.param("id");
    const role = c.req.valid("json");
    if (!role.organizationId) {
      return c.json({
        message: "Missing organizationId",
        status: 400,
        ok: false,
      });
    }
    // Only update if role belongs to org
    const existing = await db.roles.findFirst({
      where: { id, organizationId: role.organizationId },
    });
    if (!existing) {
      return c.json({
        message: "Role not found in organization",
        status: 404,
        ok: false,
      });
    }
    const updated = await db.roles.update({
      where: { id },
      include: { permissions: true },
      data: {
        name: role.name,
        permissions: {
          deleteMany: {},
          create: role.permissions.map((permission) => ({
            resource: permission.resource,
            action: permission.action,
          })),
        },
      },
    });
    return c.json({ data: updated, status: 200, ok: true }, 200);
  }
);

roles.delete("/:id", async (c) => {
  const db = getPrisma(c.env.DATABASE_URL);
  const id = c.req.param("id");
  const organizationId = c.req.query("organizationId");
  if (!organizationId) {
    return c.json({
      message: "Missing organizationId",
      status: 400,
      ok: false,
    });
  }
  // Only delete if role belongs to org
  const existing = await db.roles.findFirst({ where: { id, organizationId } });
  if (!existing) {
    return c.json({
      message: "Role not found in organization",
      status: 404,
      ok: false,
    });
  }
  await db.roles.delete({ where: { id } });
  return c.json(
    { message: "Role deleted successfully", status: 200, ok: true },
    200
  );
});
