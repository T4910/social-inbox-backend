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

// Get all users (organization-aware)
users.get("/", async (c) => {
  const db = getPrisma(c.env.DATABASE_URL);
  const organizationId = c.req.query("organizationId");
  if (!organizationId) {
    return c.json({
      message: "Missing organizationId",
      status: 400,
      ok: false,
    });
  }
  try {
    // Find all user memberships for this org, then fetch users
    const memberships = await db.userOrganization.findMany({
      where: { organizationId },
      include: { user: true, role: true },
    });
    const users = memberships.map((m) => ({ ...m.user, orgRole: m.role }));
    return c.json({ data: users, status: 200, ok: true }, 200);
  } catch (error) {
    return c.json(
      { message: "Failed to fetch users", ok: false, status: 500 },
      500
    );
  }
});

// Get a user by ID (organization-aware)
users.get("/:id", async (c) => {
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
  try {
    const membership = await db.userOrganization.findFirst({
      where: { userId: id, organizationId },
      include: { user: true, role: true },
    });
    if (!membership) {
      return c.json(
        { message: "User not found in organization", ok: false, status: 404 },
        404
      );
    }
    return c.json({
      data: { ...membership.user, orgRole: membership.role },
      status: 200,
      ok: true,
    });
  } catch (error) {
    return c.json({ message: `Failed to fetch user ${error}` }, 500);
  }
});

// Update a user by ID (organization-aware)
users.put("/:id", zValidator("json", updateUserSchema), async (c) => {
  const db = getPrisma(c.env.DATABASE_URL);
  const id = c.req.param("id");
  const organizationId = c.req.query("organizationId");
  const body = c.req.valid("json");
  if (!organizationId) {
    return c.json({
      message: "Missing organizationId",
      status: 400,
      ok: false,
    });
  }
  try {
    // Only update if user is in org
    const membership = await db.userOrganization.findFirst({
      where: { userId: id, organizationId },
    });
    if (!membership) {
      return c.json(
        { message: "User not found in organization", status: 404 },
        404
      );
    }
    // Update user fields
    const updatedUser = await db.user.update({
      where: { id },
      data: { ...body.user },
      // include: { roles: true },
    });
    // Optionally update org role
    if (body.role?.name) {
      const role = await db.roles.findFirst({
        where: { name: body.role.name, organizationId },
      });
      if (role) {
        await db.userOrganization.update({
          where: { id: membership.id },
          data: { roleId: role.id },
        });
      }
    }
    return c.json({ data: updatedUser, status: 200, ok: true }, 200);
  } catch (error) {
    return c.json({ message: "Failed to update user", status: 500 }, 500);
  }
});

// Delete a user by ID (organization-aware)
users.delete("/:id", async (c) => {
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
  try {
    // Only delete membership, not the user globally
    const membership = await db.userOrganization.findFirst({
      where: { userId: id, organizationId },
    });
    if (!membership) {
      return c.json(
        { message: "User not found in organization", status: 404 },
        404
      );
    }
    await db.userOrganization.delete({ where: { id: membership.id } });
    return c.json(
      { message: "User removed from organization", ok: true, status: 200 },
      200
    );
  } catch (error) {
    return c.json(
      {
        message: "Failed to remove user from organization",
        ok: false,
        status: 500,
      },
      500
    );
  }
});

export default users;
