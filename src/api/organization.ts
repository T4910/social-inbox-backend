import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { AppBindings } from "..";
import { getPrisma } from "../lib/db";
import { getResend } from "../lib/email";
import { generateToken } from "../lib/jwt";

const orgSchema = z.object({
  userId: z.string(),
  name: z.string().min(2),
  invites: z.string().email().array().optional(), // comma-separated emails
});

const inviteSchema = z.object({
  userId: z.string(),
  invites: z.string().email().array(),
});

const organization = new Hono<AppBindings>();

organization.post("/", zValidator("json", orgSchema), async (c) => {
  const db = getPrisma(c.env.DATABASE_URL);
  const { orgInvite } = getResend(c.env.RESEND_API_KEY);
  const { userId, name, invites } = c.req.valid("json");

  // Check if userId is valid
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return c.json({
      ok: false,
      message: "User not found",
      status: 404,
    });
  }

  // Check if the organization name already exists
  const existingOrg = await db.organization.findFirst({
    where: { name },
  });

  if (existingOrg) {
    return c.json({
      ok: false,
      message: "Organization name already exists",
      status: 400,
    });
  }

  //   get all permissions
  const permissions = await db.permissions.findMany();

  if (!permissions) {
    return c.json({
      ok: false,
      message: "Failed to fetch permissions",
      status: 500,
    });
  }

  console.log("somehting wrong with naem", name);
  // Create organization with default roles
  const org = await db.organization.create({
    data: {
      name,
      roles: {
        create: [
          {
            name: "administrator",
            description: "Full access to all resources",
            permissions: {
              connect: permissions.map((p) => ({ id: p.id })),
            },
          },
          {
            name: "editor",
            description: "Can create and edit tasks and projects",
            permissions: {
              connect: permissions
                .filter((p) => p.resource === "tasks")
                .map((p) => ({ id: p.id })),
            },
          },
          {
            name: "viewer",
            description: "Can view tasks and projects",
            permissions: {
              connect: permissions
                .filter((p) => p.resource === "tasks" && p.action === "read")
                .map((p) => ({ id: p.id })),
            },
          },
        ],
      },
    },
    include: { roles: true },
  });

  if (!org) {
    return c.json({
      ok: false,
      message: "Failed to create organization",
      status: 500,
    });
  }

  // Add creator as admin member
  await db.userOrganization.create({
    data: {
      userId,
      organizationId: org.id,
      // return the roleId of the role with name 'administrator'
      roleId: org.roles.find((role) => role.name === "administrator")!.id,
    },
  });

  // Handle invites (if any)
  if (invites) {
    const emails = invites;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    for (const email of emails) {
      const token = crypto.randomUUID();
      await db.invite.create({
        data: {
          email,
          organizationId: org.id,
          invitedById: userId,
          token,
          expiresAt,
        },
      });
      // Send invite email
      const inviteUrl = `${c.env.FRONTEND_URL}/invite/${token}`;
      await orgInvite(email, org.name, inviteUrl);
    }
  }

  // Genereate a token for the user
  const token = await generateToken(userId, org.id, c.env.JWT_SECRET);

  return c.json({ ok: true, data: { token }, status: 200 });
});

organization.post("/invite", zValidator("json", inviteSchema), async (c) => {
  const db = getPrisma(c.env.DATABASE_URL);
  const { orgInvite } = getResend(c.env.RESEND_API_KEY);
  const { userId, invites } = c.req.valid("json");
  const organizationId = c.req.query("organizationId");

  if (!organizationId) {
    return c.json({
      ok: false,
      message: "Missing organizationId",
      status: 400,
    });
  }

  // Check if the organization exists
  const org = await db.organization.findUnique({
    where: { id: organizationId },
  });

  if (!org) {
    return c.json({
      ok: false,
      message: "Organization not found",
      status: 404,
    });
  }

  // Handle invites (if any)
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    for (const email of invites) {
      const token = crypto.randomUUID();
      await db.invite.create({
        data: {
          email,
          organizationId,
          invitedById: userId,
          token,
          expiresAt,
        },
      });
      // Send invite email
      const inviteUrl = `${c.env.FRONTEND_URL}/invite/${token}`;
      await orgInvite(email, org.name, inviteUrl);
    }
  } catch (error) {
    return c.json({
      ok: false,
      message: "Failed to send invites",
      status: 500,
    });
  }

  return c.json({
    ok: true,
    message: "Invites sent successfully",
    status: 200,
  });
});

organization.post("/accept-invite/:token", async (c) => {
  const db = getPrisma(c.env.DATABASE_URL);
  const { token } = c.req.param();

  // Find invite
  const invite = await db.invite.findUnique({ where: { token } });
  if (!invite || invite.accepted || invite.expiresAt < new Date()) {
    return c.json({
      ok: false,
      message: "Invalid or expired invite.",
      status: 400,
    });
  }

  // Check if user exists
  const { email } = invite;
  let user = await db.user.findUnique({ where: { email } });
  if (!user) {
    // Optionally, you could require registration first, or auto-create a user
    return c.json({
      ok: true,
      data: {
        type: "register-user-first",
        message: "No user found for invite email. Please register first.", // don't change the wording - tightly couples with frontend
        inviteToken: invite.token,
      },
      status: 404,
    });
  }

  // Add user to organization as viewer (or default role)
  const org = await db.organization.findUnique({
    where: { id: invite.organizationId },
    include: { roles: true },
  });
  if (!org) {
    return c.json({
      ok: false,
      message: "Organization not found.",
      status: 404,
    });
  }
  const viewerRole = org.roles.find((r) => r.name === "viewer") || org.roles[0];
  await db.userOrganization.create({
    data: {
      userId: user.id,
      organizationId: org.id,
      roleId: viewerRole.id,
    },
  });
  await db.invite.update({
    where: { id: invite.id },
    data: { accepted: true },
  });

  // Optionally, generate a JWT for the user for this org
  const authToken = await generateToken(user.id, org.id, c.env.JWT_SECRET);

  return c.json({ ok: true, data: { token: authToken }, status: 200 });
});

organization.get("/validate-invite/:token", async (c) => {
  const db = getPrisma(c.env.DATABASE_URL);
  const { token } = c.req.param();
  const isRegisterRoute = !!c.req.query("register");
  const invite = isRegisterRoute
    ? await db.invite.findUnique({
        where: { token },
        select: {
          email: true,
          organizationId: true,
          accepted: true,
          expiresAt: true,
        },
      })
    : await db.invite.findUnique({ where: { token } });

  console.log(invite, "invite");

  if (!invite || invite.accepted || invite.expiresAt < new Date()) {
    return c.json({
      ok: false,
      message: "Invalid or expired invite.",
      status: 400,
    });
  }

  if (isRegisterRoute) {
    return c.json({
      ok: true,
      data: {
        message: "Invite is valid.",
        email: invite.email,
        organizationId: invite.organizationId,
      },
      status: 200,
    });
  }

  return c.json({
    ok: true,
    data: { message: "Invite is valid." },
    status: 200,
  });
});

export default organization;
