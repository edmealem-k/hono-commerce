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
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000";
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
