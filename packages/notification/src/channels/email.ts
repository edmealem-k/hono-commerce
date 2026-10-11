import { env } from "@hono-commerce/env/api";
import { enqueueEmail } from "@hono-commerce/queue";

import type { NotificationPayloadData } from "../types";

export interface SendEmailNotificationOptions {
  to: string;
  subject?: string;
  data: NotificationPayloadData;
  tenantId?: string;
  idempotencyKey?: string;
}

function normalizeActionUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const baseUrl = env.DASHBOARD_URL || env.BETTER_AUTH_URL;
  return `${baseUrl.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
}

export async function sendEmailNotification({
  to,
  subject,
  data,
  tenantId,
  idempotencyKey,
}: SendEmailNotificationOptions): Promise<boolean> {
  try {
    const actionUrl = normalizeActionUrl(data.actionUrl);

    await enqueueEmail(
      {
        to,
        subject: subject || data.title,
        template: "system-alert",
        props: {
          title: data.title,
          message: data.message,
          actionUrl,
        },
        tenantId,
        idempotencyKey,
      },
      idempotencyKey ? { jobId: idempotencyKey } : undefined,
    );
    return true;
  } catch (err) {
    console.error(
      `[Notification:Email] Failed to enqueue email for ${to}:`,
      err,
    );
    return false;
  }
}
