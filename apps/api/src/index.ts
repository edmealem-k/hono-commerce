import { auth } from "@hono-commerce/auth";
import { env } from "@hono-commerce/env/api";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";

import { fail } from "./lib/response";
import { invitationsRouter } from "./modules/invitations/invitations.routes";
import { tenantsRouter } from "./modules/tenants/tenants.routes";
import { queuesRouter } from "./routes/admin/queues";
import { storageRouter } from "./routes/storage";

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
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

const routes = app
  .basePath("/api/v1")
  .get("/health", (c) => {
    return c.json({ status: "ok" });
  })
  .route("/storage", storageRouter)
  .route("/invitations", invitationsRouter)
  .route("/tenants", tenantsRouter);

app.on(["POST", "GET"], "/api/v1/auth/*", (c) => auth.handler(c.req.raw));
app.route("/admin/queues", queuesRouter);
app.get("/admin/queues/", (c) => c.redirect("/admin/queues", 301));

app.get("/", (c) => {
  return c.text("OK");
});

app.notFound((c) => {
  return c.json(
    fail({
      error: `Route not found: ${c.req.method} ${c.req.path}`,
      code: "NOT_FOUND",
    }),
    404,
  );
});

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json(
      fail({
        error: err.message,
        code: `HTTP_${err.status}`,
      }),
      err.status,
    );
  }

  console.error("Unhandled API error:", err);
  return c.json(
    fail({
      error: "An internal server error occurred",
      code: "INTERNAL_ERROR",
    }),
    500,
  );
});

export type AppType = typeof routes;
export default app;
