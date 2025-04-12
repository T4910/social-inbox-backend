import { Hono } from "hono";
import { cors } from "hono/cors";
import auth from "./api/auth";
import { roles } from "./api/roles";
import { seed } from "./api/seed";
import { tasks } from "./api/task";
import users from "./api/users";

export type AppBindings = {
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
    ENVIRONMENT: "development" | "production";
    FRONTEND_URL: string;
  };
  Variables: {
    userId: string;
  };
};

const app = new Hono<AppBindings>();

app.use("*", async (c, next) => {
  const middleware = cors({
    origin: ["http://localhost:3000", c.env.FRONTEND_URL], // or your deployed frontend domain
    credentials: true, // allows cookies to be sent
    allowHeaders: ["Content-Type"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  return middleware(c, next);
});

app.route("/api/seed", seed);
app.route("/api/auth", auth);
app.route("/api/tasks", tasks);
app.route("/api/roles", roles);
app.route("/api/users", users);

app.get("/", async (c) => {
  return c.json({ hi: "Hello Hono!" });
});

export default app;
