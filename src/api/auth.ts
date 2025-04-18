import { googleAuth } from "@hono/oauth-providers/google";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie"; // Cookie utilities
import { AppBindings } from "..";
import { getPrisma } from "../lib/db";
import { generateToken, verifyToken } from "../lib/jwt"; // JWT utility functions
import {
  googleAuthMiddleware,
  preventLoggedInUser,
} from "../middleware/authMiddleware";

const auth = new Hono<AppBindings>();

auth.post("/me", async (ctx) => {
  const db = getPrisma(ctx.env.DATABASE_URL);
  const { token } = await ctx.req.json();

  if (!token) {
    return ctx.json({ message: "Not authenticated", status: 401, ok: false });
  }

  // Verify the token
  const decoded = (await verifyToken(token, ctx.env.JWT_SECRET)) as {
    userId: string;
    currentOrgId?: string;
  } | null;
  if (!decoded) {
    return ctx.json({
      message: "Invalid or expired token",
      status: 401,
      ok: false,
    });
  }

  // Fetch the user and their memberships (orgs)
  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      email: true,
      // roles: true,
      memberships: {
        select: {
          organization: { select: { id: true, name: true } },
          organizationId: true,
          role: { select: { name: true } },
        },
      },
    },
  });
  if (!user) {
    return ctx.json({ message: "User not found", status: 404, ok: false });
  }

  // Format memberships for frontend
  const memberships = user.memberships.map((m) => {
    // console.log(
    //   m.organizationId,
    //   decoded,
    //   m.organizationId === decoded.currentOrgId,
    //   " from token in auth.ts"
    // );

    return {
      organizationId: m.organizationId,
      organizationName: m.organization.name,
      role: m.role.name,
      isCurrent: m.organizationId === decoded.currentOrgId,
    };
  });

  return ctx.json({
    data: {
      id: user.id,
      email: user.email,
      // roles: user.roles,
      memberships,
    },
    status: 200,
    ok: true,
  });
});

// POST /api/auth/checkPermissions { token, actions, resources }
auth.post("/checkPermissions", async (ctx) => {
  const db = getPrisma(ctx.env.DATABASE_URL);
  const { token, actions, resources } = (await ctx.req.json()) as {
    token: string;
    actions: string[];
    resources: string[];
  };

  if (!token) {
    return ctx.json({ message: "Not authenticated", status: 401, ok: false });
  }

  // Verify the token
  const decoded = (await verifyToken(token, ctx.env.JWT_SECRET)) as {
    userId: string;
    currentOrgId: string;
  } | null;
  if (!decoded) {
    return ctx.json({
      message: "Invalid or expired token",
      status: 401,
      ok: false,
    });
  }

  // Find the user's membership for the current org
  const membership = await db.userOrganization.findFirst({
    where: { userId: decoded.userId, organizationId: decoded.currentOrgId },
    include: { role: { include: { permissions: true } } },
  });
  if (!membership) {
    return ctx.json({
      message: "Not a member of this organization",
      status: 403,
      ok: false,
    });
  }

  // Check if the user's role has the required permissions
  const hasPermission = membership.role.permissions.some((permission) => {
    return (
      actions.includes(permission.action) &&
      resources.includes(permission.resource)
    );
  });

  // console.log(
  //   "Membaership: ",
  //   membership,
  //   "Has permission: ",
  //   hasPermission,
  //   "token",
  //   decoded,
  //   actions,
  //   resources
  // );

  if (!hasPermission) {
    return ctx.json({ message: "Forbidden", status: 403, ok: false });
  }

  return ctx.json({ data: true, status: 200, ok: true });
});

auth.use(preventLoggedInUser);

auth.post("/register", async (ctx) => {
  const db = getPrisma(ctx.env.DATABASE_URL);
  const { email, password } = await ctx.req.json();

  // Check if the user already exists in the database
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return ctx.json({ message: "User already exists", status: 400, ok: false });
  }

  // Create a new user in the database
  const newUser = await db.user.create({
    data: {
      email,
      password, // Store the hashed password
    },
  });

  return ctx.json({ data: { userId: newUser.id }, status: 200, ok: true });
});

auth.post("/login", async (ctx) => {
  const db = getPrisma(ctx.env.DATABASE_URL);
  const { email, password } = await ctx.req.json();

  // Find the user by email
  const user = await db.user.findUnique({
    where: { email },
    include: { memberships: true },
  });
  if (!user || user.password !== password) {
    return ctx.json({ message: "Invalid credentials", status: 401, ok: false });
  }

  // Generate JWT token
  const token = await generateToken(
    user.id,
    user.memberships[0].organizationId,
    ctx.env.JWT_SECRET
  );

  return ctx.json({ data: { token }, status: 200, ok: true });
});

// Endpoint to switch organization and issue a new JWT
// POST /api/auth/switch-organization { token, organizationId }
auth.post("/switch-organization", async (ctx) => {
  const db = getPrisma(ctx.env.DATABASE_URL);
  const { token, organizationId } = await ctx.req.json();

  if (!token || !organizationId) {
    return ctx.json({
      message: "Missing token or organizationId",
      status: 400,
      ok: false,
    });
  }

  // Verify the token
  const decoded = (await verifyToken(token, ctx.env.JWT_SECRET)) as {
    userId: string;
  } | null;
  if (!decoded) {
    return ctx.json({
      message: "Invalid or expired token",
      status: 401,
      ok: false,
    });
  }

  // Check if user is a member of the organization
  const membership = await db.userOrganization.findFirst({
    where: { userId: decoded.userId, organizationId },
  });
  if (!membership) {
    return ctx.json({
      message: "Not a member of this organization",
      status: 403,
      ok: false,
    });
  }

  // Issue new JWT for the selected organization
  const newToken = await generateToken(
    decoded.userId,
    organizationId,
    ctx.env.JWT_SECRET
  );
  return ctx.json({ data: { token: newToken }, status: 200, ok: true });
});

// Google OAuth2 login
// Redirect URI: /api/auth/google
// Callback: /api/auth/google (handled by middleware)
auth.use("/google", googleAuthMiddleware, async (c) => {
  const googleUser = c.get("user-google");
  if (!googleUser?.email) {
    return c.json({ ok: false, message: "Google login failed" }, 401);
  }
  const db = getPrisma(c.env.DATABASE_URL);
  // Try to find user by googleId or email
  let user = await db.user.findFirst({
    where: {
      OR: [{ googleId: googleUser.id }, { email: googleUser.email }],
    },
  });
  // If not found, create a new user
  if (!user) {
    user = await db.user.create({
      data: {
        email: googleUser.email,
        googleId: googleUser.id,
        provider: "google",
        password: "", // Not used for Google users
      },
    });
    // Optionally: prompt for org creation/selection on frontend
  } else if (!user.googleId) {
    // Link Google account to existing user
    await db.user.update({
      where: { id: user.id },
      data: { googleId: googleUser.id, provider: "google" },
    });
  }
  // Issue JWT for the user (pick a default org if needed)
  const memberships = await db.userOrganization.findMany({
    where: { userId: user.id },
  });
  const orgId = memberships[0]?.organizationId;
  const token = await generateToken(user.id, orgId, c.env.JWT_SECRET);
  setCookie(c, "auth_token", token, {
    path: "/",
    httpOnly: true,
    secure: true,
  });
  return c.redirect(`${c.env.FRONTEND_URL}/dashboard`);
});

export default auth;
