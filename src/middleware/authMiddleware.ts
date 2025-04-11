// import { Context, Next } from "hono";
// import { AppBindings } from "..";

import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';

export const preventLoggedInUser = createMiddleware(async (c, next) => {
  console.log(`[${c.req.method}] ${c.req.url}`)
    const token = getCookie(c, "auth_token");
  
    if (token) {
      return c.json({ message: "Already logged in", status: 400 });
    }
    await next();
})

// rbacMiddleware(role: 'admin' | 'editor' | 'viewer')