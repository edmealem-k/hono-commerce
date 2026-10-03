import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import { auth } from "@hono-commerce/auth";
import { env } from "@hono-commerce/env/api";
import { getEmailQueue } from "@hono-commerce/queue";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";

const serverAdapter = new HonoAdapter(serveStatic);
const BASE_PATH = "/admin/queues";
serverAdapter.setBasePath(BASE_PATH);

createBullBoard({
  queues: [
    new BullMQAdapter(getEmailQueue()),
    // Future queues are registered here in one line:
    // new BullMQAdapter(getOrderQueue()),
    // new BullMQAdapter(getWebhookQueue()),
  ],
  serverAdapter,
});

export const queuesRouter = new Hono();

// Auth Guard: In production, require superadmin session. In dev, allow access for debugging.
queuesRouter.use("/*", async (c, next) => {
  if (env.NODE_ENV === "development") {
    return next();
  }

  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.text("Unauthorized: Admin session required", 401);
  }

  const userRole = (session.user as { role?: string }).role;
  if (userRole !== "admin") {
    return c.text("Forbidden: Superadmin access required", 403);
  }

  return next();
});

queuesRouter.route("/", serverAdapter.registerPlugin());
