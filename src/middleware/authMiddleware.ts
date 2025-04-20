// import { Context, Next } from "hono";
// import { AppBindings } from "..";

import { googleAuth } from "@hono/oauth-providers/google";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { AppBindings } from "..";
import { getPrisma } from "../lib/db";
import { verifyToken } from "../lib/jwt";

export const preventLoggedInUser = createMiddleware(async (c, next) => {
  console.log(`[${c.req.method}] ${c.req.url}`);
  const token = getCookie(c, "auth_token");

  if (token) {
    return c.json({ message: "Already logged in", status: 400 });
  }
  await next();
});

export const getUserInfoFromToken = createMiddleware(async (c, next) => {
  const db = getPrisma(c.env.DATABASE_URL);
  const { token } = await c.req.json();

  console.log("is there a token?", token);

  if (!token) {
    return c.json({ message: "Not authenticated", status: 401 });
  }

  // Verify the token
  const decoded = (await verifyToken(token, c.env.JWT_SECRET)) as {
    userId: string;
  } | null;
  if (!decoded) {
    return c.json({
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
  // c.var.userId = decoded.userId
  if (!user) {
    return c.json({ message: "User not found", status: 404 });
  }

  c.set("user", user);
  await next();
});

export const googleAuthMiddleware = createMiddleware<AppBindings>(
  async (c, next) => {
    googleAuth({
      client_id: c.env.GOOGLE_ID,
      client_secret: c.env.GOOGLE_SECRET,
      scope: ["openid", "email", "profile"],
    });

    await next();
  }
);
