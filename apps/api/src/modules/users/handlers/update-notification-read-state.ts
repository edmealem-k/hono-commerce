import { and, db, eq } from "@hono-commerce/db";
import { notification } from "@hono-commerce/db/schema/notification";
import {
  notificationParamSchema,
  updateNotificationReadStateSchema,
} from "@hono-commerce/types";
import { createFactory } from "hono/factory";

import { fail, ok } from "../../../lib/response";
import { validated } from "../../../lib/validation";

import type { AuthEnv } from "../../../types/auth";

const factory = createFactory<AuthEnv>();

export const updateNotificationReadStateHandler = factory.createHandlers(
  validated("param", notificationParamSchema),
  validated("json", updateNotificationReadStateSchema),
  async (c) => {
    const user = c.get("user");
    const { notificationId } = c.req.valid("param");
    const { isRead } = c.req.valid("json");

    const [updated] = await db
      .update(notification)
      .set({
        isRead,
        readAt: isRead ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(notification.id, notificationId),
          eq(notification.userId, user.id),
        ),
      )
      .returning({ id: notification.id });

    if (!updated) {
      return c.json(
        fail({
          error: "Notification not found",
          code: "NOT_FOUND",
        }),
        404,
      );
    }

    return c.json(ok({ message: "Notification read state updated" }), 200);
  },
);
