import { Hono } from "hono";
import { cors } from 'hono/cors';
import { getPrisma } from "./lib/db";
// import auth from "./api/auth";

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string
    JWT_SECRET: string
  }
  Variables: {
    userId: string
  }
}>();


app.use(
  '*',
  cors({
    origin: ['http://localhost:3000'], // or your deployed frontend domain
    credentials: true, // allows cookies to be sent
    allowHeaders: ['Content-Type'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);



app.get("/", async (c) => {
  const db = getPrisma(c.env.DATABASE_URL)

  const users = await db.user.findMany()

  return c.json({ hi: "Hello Hono!", users });
});

export default app;
