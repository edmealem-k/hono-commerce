import { Hono } from "hono";

import { requireAuth } from "../../lib/auth/require-auth";
import { listNotificationsHandler } from "./handlers/list-notifications";
import { listWorkspacesHandler } from "./handlers/list-workspaces";
import { updateNotificationReadStateHandler } from "./handlers/update-notification-read-state";

import type { AuthEnv } from "../../types/auth";

export const usersRouter = new Hono<AuthEnv>()
  .use("/me/*", requireAuth())
  .get("/me/workspaces", ...listWorkspacesHandler)
  .get("/me/notifications", ...listNotificationsHandler)
  .patch(
    "/me/notifications/:notificationId",
    ...updateNotificationReadStateHandler,
  );
