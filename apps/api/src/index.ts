import { auth, authOriginPolicy } from "@hono-commerce/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";

import { fail } from "./lib/response";
import { invitationsRouter } from "./modules/invitations/invitations.routes";
import { storageRouter } from "./modules/storage/storage.routes";
import { tenantsRouter } from "./modules/tenants/tenants.routes";
import { usersRouter } from "./modules/users/users.routes";
import { queuesRouter } from "./routes/admin/queues";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: (origin) => {
      if (!origin || authOriginPolicy.isAllowed(origin)) {
        return origin;
      }
      return undefined;
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
  .route("/tenants", tenantsRouter)
  .route("/users", usersRouter);

app.all("/api/v1/auth/*", (c) => auth.handler(c.req.raw));
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
