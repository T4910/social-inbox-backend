import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ hi: "Hello Hono!" });
});

export default app;
