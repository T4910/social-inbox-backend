import bcrypt from "bcryptjs";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie"; // Cookie utilities
import db from "../lib/db";
import { generateToken, verifyToken } from "../lib/jwt"; // JWT utility functions

const auth = new Hono();

auth.post("/api/register", async (ctx) => {
  const { email, password } = await ctx.req.json();

  // Check if the user already exists in the database
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return ctx.text("User already exists", 400);
  }

  // Hash the password using bcrypt
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create a new user in the database
  const newUser = await db.user.create({
    data: {
      email,
      password: hashedPassword, // Store the hashed password
    },
  });

  // Generate JWT token
  const token = generateToken(newUser.id);

  // Set the token in an HttpOnly cookie
  setCookie(ctx, "auth_token", token, {
    httpOnly: true,
    secure: true, // set to true in production with HTTPS
    maxAge: 60 * 60, // 1 hour expiration
    path: "/", // Make it available across the entire site
  });

  return ctx.json({ message: "User registered successfully" });
});

auth.post("/api/login", async (ctx) => {
  const { email, password } = await ctx.req.json();

  // Find the user by email
  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.password !== password) {
    return ctx.text("Invalid credentials", 401);
  }

  // Generate JWT token
  const token = generateToken(user.id);

  // Set the token in an HttpOnly cookie
  setCookie(ctx, "auth_token", token, {
    httpOnly: true,
    secure: true, // set to true in production with HTTPS
    maxAge: 60 * 60, // 1 hour expiration
    path: "/", // Make it available across the entire site
  });

  return ctx.json({ message: "Logged in successfully" });
});

auth.get("/api/auth/me", async (ctx) => {
  const token = getCookie(ctx, "auth_token");

  if (!token) {
    return ctx.text("Not authenticated", 401);
  }

  // Verify the token
  const decoded = verifyToken(token) as { userId: string } | null;
  if (!decoded) {
    return ctx.text("Invalid or expired token", 401);
  }

  // Fetch the user from the database using the user ID from the decoded token
  const user = await db.user.findUnique({ where: { id: decoded.userId } });

  if (!user) {
    return ctx.text("User not found", 404);
  }

  return ctx.json({ user });
});

export default auth;
