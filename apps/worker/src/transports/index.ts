import { env } from "@hono-commerce/env/worker";

import { logEmailToConsole } from "./console";
import { sendEmailViaResend } from "./resend";

import type { EmailJobData } from "@hono-commerce/queue";

export async function dispatchEmail({
  data,
  html,
  text,
}: {
  data: EmailJobData;
  html: string;
  text: string;
}): Promise<void> {
  if (env.NODE_ENV === "development" || !env.RESEND_API_KEY) {
    logEmailToConsole({
      ...data,
      text,
    });

    if (env.RESEND_API_KEY) {
      try {
        await sendEmailViaResend({
          to: data.to,
          subject: data.subject,
          html,
          text,
        });
      } catch (err) {
        console.warn("[Worker:Resend] Dev send warning (non-fatal):", err);
      }
    }
    return;
  }

  await sendEmailViaResend({
    to: data.to,
    subject: data.subject,
    html,
    text,
  });
}
