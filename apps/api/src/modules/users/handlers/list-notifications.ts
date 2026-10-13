import { and, count, db, eq } from "@hono-commerce/db";
import { notification } from "@hono-commerce/db/schema/notification";
import { notificationListQuerySchema } from "@hono-commerce/types";
import { createFactory } from "hono/factory";

import { ok } from "../../../lib/response";
import { validated } from "../../../lib/validation";

import type { AuthEnv } from "../../../types/auth";

const factory = createFactory<AuthEnv>();

function safeActionUrl(actionUrl: string | null) {
  if (!actionUrl || !actionUrl.startsWith("/") || actionUrl.startsWith("//")) {
    return null;
  }

  return actionUrl;
}

export const listNotificationsHandler = factory.createHandlers(
  validated("query", notificationListQuerySchema),
  async (c) => {
    const user = c.get("user");
    const { limit } = c.req.valid("query");

    const [items, unreadResult] = await Promise.all([
      db.query.notification.findMany({
        columns: {
          id: true,
          tenantId: true,
          type: true,
          title: true,
          message: true,
          actionUrl: true,
          isRead: true,
          readAt: true,
          createdAt: true,
        },
        where: (table, { eq }) => eq(table.userId, user.id),
        orderBy: (table, { desc }) => desc(table.createdAt),
        limit,
      }),
      db
        .select({ count: count(notification.id) })
        .from(notification)
        .where(
          and(eq(notification.userId, user.id), eq(notification.isRead, false)),
        ),
    ]);

    return c.json(
      ok({
        data: {
          items: items.map((item) => ({
            ...item,
            actionUrl: safeActionUrl(item.actionUrl),
          })),
          unreadCount: Number(unreadResult[0]?.count ?? 0),
        },
      }),
      200,
    );
  },
);
