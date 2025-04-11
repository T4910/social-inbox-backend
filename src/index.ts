import { Hono } from "hono";
import { cors } from 'hono/cors';
import auth from "./api/auth";
import { getPrisma } from "./lib/db";

export type AppBindings = {
  Bindings: {
    DATABASE_URL: string
    JWT_SECRET: string
    ENVIRONMENT: "development" | "production"
    FRONTEND_URL: string
  }
  Variables: {
    userId: string
  }
}

const app = new Hono<AppBindings>();


app.use(
  '*',
  async (c, next) => {

    const middleware = cors({
      origin: ['http://localhost:3000', c.env.FRONTEND_URL], // or your deployed frontend domain
      credentials: true, // allows cookies to be sent
      allowHeaders: ['Content-Type'],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    })

    return middleware(c, next)
  }
);

app.route('/api/auth/', auth);


app.get("/", async (c) => {
  const db = getPrisma(c.env.DATABASE_URL)

  const users = await db.user.findMany()

  if(c.var.userId) console.log('User ID:', c.var.userId)
  return c.json({ hi: "Hello Hono!", users });
});

export default app;
