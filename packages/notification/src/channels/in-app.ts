import { db } from "@hono-commerce/db";
import { notification } from "@hono-commerce/db/schema/notification";

import type { NotificationPayloadData } from "../types";

export interface SendInAppNotificationOptions {
  recipientId?: string;
  userId?: string;
  tenantId?: string;
  type?: string;
  data: NotificationPayloadData;
}

export async function sendInAppNotification(
  options: SendInAppNotificationOptions,
): Promise<boolean> {
  try {
    let resolvedUserId = options.userId;
    let resolvedTenantId = options.tenantId;

    if (options.recipientId) {
      if (options.recipientId.startsWith("tenant:")) {
        resolvedTenantId = resolvedTenantId ?? options.recipientId.slice(7);
      } else if (!options.recipientId.startsWith("system:")) {
        resolvedUserId = resolvedUserId ?? options.recipientId;
      }
    }

    await db.insert(notification).values({
      userId: resolvedUserId ?? null,
      tenantId: resolvedTenantId ?? null,
      type: options.type ?? "GENERAL",
      title: options.data.title,
      message: options.data.message,
      actionUrl: options.data.actionUrl ?? null,
      metadata: options.data.metadata ?? null,
    });

    console.log(
      `[Notification:InApp] Persisted notification for user: ${resolvedUserId ?? "n/a"}, tenant: ${resolvedTenantId ?? "n/a"}`,
      options.data.title,
    );
    return true;
  } catch (err) {
    console.error(
      `[Notification:InApp] Failed to persist in-app notification:`,
      err,
    );
    return false;
  }
}
