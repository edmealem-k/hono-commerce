import { env } from "@hono-commerce/env/worker";
import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResendClient(): Resend | null {
  if (!env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY);
  }
  return resendClient;
}

export async function sendEmailViaResend({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ id?: string }> {
  const client = getResendClient();
  if (!client) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const { data, error } = await client.emails.send({
    from: env.EMAIL_FROM,
    to: [to],
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(`Resend email delivery failed: ${error.message}`);
  }

  return { id: data?.id };
}
