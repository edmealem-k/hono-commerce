import type { NotificationPayloadData } from "../types";

export interface InAppNotificationRecord {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: Date;
}

export async function sendInAppNotification({
  recipientId,
  data,
}: {
  recipientId: string;
  data: NotificationPayloadData;
}): Promise<boolean> {
  try {
    // In a full implementation, this writes to the database notifications table or Redis Pub/Sub
    console.log(
      `[Notification:InApp] Dispatched to recipient: ${recipientId}`,
      data.title,
    );
    return true;
  } catch (err) {
    console.error(
      `[Notification:InApp] Failed to deliver to: ${recipientId}`,
      err,
    );
    return false;
  }
}
