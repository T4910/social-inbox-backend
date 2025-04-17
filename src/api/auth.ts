import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie"; // Cookie utilities
import { AppBindings } from "..";
import { getPrisma } from "../lib/db";
import { generateToken, verifyToken } from "../lib/jwt"; // JWT utility functions
import { preventLoggedInUser } from "../middleware/authMiddleware";

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
  } | null;
  if (!decoded) {
    return ctx.json({
      message: "Invalid or expired token",
      status: 401,
      ok: false,
    });
  }

  // Fetch the user from the database using the user ID from the decoded token
  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true },
  });
  // ctx.var.userId = decoded.userId
  if (!user) {
    return ctx.json({ message: "User not found", status: 404, ok: false });
  }

  return ctx.json({ data: user, status: 200, ok: true });
});

// auth.post("/checkPermissions", async (ctx) => {
//   const db = getPrisma(ctx.env.DATABASE_URL);
//   const { token, actions, resources } = (await ctx.req.json()) as {
//     token: string;
//     actions: string[];
//     resources: string[];
//   };

//   if (!token) {
//     return ctx.json({ message: "Not authenticated", status: 401, ok: false });
//   }

//   // Verify the token
//   const decoded = (await verifyToken(token, ctx.env.JWT_SECRET)) as {
//     userId: string;
//   } | null;
//   if (!decoded) {
//     return ctx.json({
//       message: "Invalid or expired token",
//       status: 401,
//       ok: false,
//     });
//   }

//   // Fetch the user from the database using the user ID from the decoded token
//   const user = await db.user.findUnique({
//     where: { id: decoded.userId },
//     include: { roles: { include: { permissions: true } } },
//   });
//   // ctx.var.userId = decoded.userId
//   if (!user) {
//     return ctx.json({ message: "User not found", status: 404, ok: false });
//   }

//   // Check if the user has the required permissions
//   const hasPermission = user.roles[0].permissions.some((permission) => {
//     return (
//       actions.includes(permission.action) &&
//       resources.includes(permission.resource)
//     );
//   });

//   if (!hasPermission) {
//     return ctx.json({ message: "Forbidden", status: 403, ok: false });
//   }

//   return ctx.json({ data: true, status: 200, ok: true });
// });

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

export default auth;
