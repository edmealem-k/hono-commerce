import { auth } from "@hono-commerce/auth";
import { env } from "@hono-commerce/env/api";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: (origin) => {
      const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
      if (!origin || allowedOrigins.includes(origin)) {
        return origin;
      }
      return allowedOrigins[0];
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/v1/auth/*", (c) => auth.handler(c.req.raw));

const routes = app.basePath("/api/v1").get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.get("/", (c) => {
  return c.text("OK");
});

export type AppType = typeof routes;
export default app;
