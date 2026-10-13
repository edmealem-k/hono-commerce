import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import { auth } from "@hono-commerce/auth";
import { hasPermission } from "@hono-commerce/auth/permissions";
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

// Auth Guard: queue observability always requires an authenticated permission.
queuesRouter.use("/*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.text("Unauthorized: Admin session required", 401);
  }

  if (!hasPermission(session.user, "QUEUES:READ")) {
    return c.text("Forbidden: Queue observability permission required", 403);
  }

  return next();
});

queuesRouter.route("/", serverAdapter.registerPlugin());
