import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie"; // Cookie utilities
import { AppBindings } from "..";
import { getPrisma } from "../lib/db";
import { generateToken, verifyToken } from "../lib/jwt"; // JWT utility functions
import { preventLoggedInUser } from "../middleware/authMiddleware";

const auth = new Hono<AppBindings>();

auth.get("/me", async (ctx) => {
  const db = getPrisma(ctx.env.DATABASE_URL)
  const token = getCookie(ctx, "auth_token");

  if (!token) {
    return ctx.json({message: "Not authenticated", status: 401});
  }

  // Verify the token
  const decoded = await verifyToken(token, ctx.env.JWT_SECRET) as { userId: string } | null;
  if (!decoded) {
    return ctx.json({message: "Invalid or expired token", status: 401});
  }

  console.log(decoded)

  // Fetch the user from the database using the user ID from the decoded token
  const user = await db.user.findUnique({ where: { id: decoded.userId }, select: { id: true, email: true, roles: true } });
  // ctx.var.userId = decoded.userId
  if (!user) {
    return ctx.json({message: "User not found", status: 404});
  }

  return ctx.json({ user });
});

auth.post("/logout", async (ctx) => {
  deleteCookie(ctx, 'banana', {
    path: '/',
    secure: ctx.env.ENVIRONMENT === "production",
    domain: 'example.com',
  })

  return ctx.json({message: "Logged out successfully"});
})

auth.use(preventLoggedInUser)

auth.post("/register", async (ctx) => {
  // console.log(ctx.env)
  const db = getPrisma(ctx.env.DATABASE_URL)
  const { email, password } = await ctx.req.json();

  // console.log(email, password)

  // Check if the user already exists in the database
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return ctx.json({message: "User already exists", status: 400});
  }

  const defaultRole = await db.roles.findFirst({ where: { name: "viewer" } });
  console.log(defaultRole, 76)

  // Create a new user in the database
  const newUser = await db.user.create({
    data: {
      email,
      password, // Store the hashed password
      roles: {
        connect: { id: defaultRole?.id } // Connect to the default role
      }
    },
  });

  // Generate JWT token
  const token = await generateToken(newUser.id, defaultRole?.id || '', ctx.env.JWT_SECRET);

  // Set the token in an HttpOnly cookie
  setCookie(ctx, "auth_token", token, {
    httpOnly: true,
    secure: ctx.env.ENVIRONMENT === "production", // set to true in production with HTTPS
    maxAge: 60 * 60, // 1 hour expiration
    path: "/", // Make it available across the entire site
  });

  return ctx.json({ message: "User registered successfully, log user in", status: 200 });
});

auth.post("/login", async (ctx) => {
  const db = getPrisma(ctx.env.DATABASE_URL)
  const { email, password } = await ctx.req.json();


  // Find the user by email
  const user = await db.user.findUnique({ where: { email }, include: { roles: true } });
  if (!user || user.password !== password) {
    return ctx.json({message: "Invalid credentials", status: 401});
  }
  
  console.log(email, password, user)
  // Generate JWT token
  const token = await generateToken(user.id, user.roles[0].id || '',  ctx.env.JWT_SECRET);

  // Set the token in an HttpOnly cookie
  setCookie(ctx, "auth_token", token, {
    httpOnly: true,
    secure: ctx.env.ENVIRONMENT === "production",
    maxAge: 60 * 60, // 1 hour expiration
    path: "/", // Make it available across the entire site
  });

  return ctx.json({ message: "Logged in successfully", status: 200 });
});


export default auth;
