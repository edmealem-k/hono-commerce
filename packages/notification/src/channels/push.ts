import type { NotificationPayloadData } from "../types";

export async function sendPushNotification({
  recipientId,
  data,
}: {
  recipientId: string;
  data: NotificationPayloadData;
}): Promise<boolean> {
  try {
    console.log(
      `[Notification:Push] Sending push alert to ${recipientId}: ${data.title}`,
    );
    return true;
  } catch (err) {
    console.error(
      `[Notification:Push] Failed to send push to ${recipientId}`,
      err,
    );
    return false;
  }
}
