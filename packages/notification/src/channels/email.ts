import type { NotificationPayloadData } from "../types";

export async function sendEmailNotification({
  to,
  subject,
  data,
}: {
  to: string;
  subject?: string;
  data: NotificationPayloadData;
}): Promise<boolean> {
  try {
    // In a full implementation, this calls Nodemailer or Resend SDK
    console.log(
      `[Notification:Email] Sending to ${to}: ${subject || data.title}`,
    );
    return true;
  } catch (err) {
    console.error(`[Notification:Email] Failed to send email to ${to}`, err);
    return false;
  }
}
