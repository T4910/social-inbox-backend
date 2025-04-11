import { Hono } from "hono";
import auth from "./api/auth";

const app = new Hono();

app.route("/api/auth", auth);

app.get("/", (c) => {
  return c.json({ hi: "Hello Hono!" });
});

export default app;
