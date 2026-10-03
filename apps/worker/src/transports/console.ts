import type { EmailJobData } from "@hono-commerce/queue";

export interface ConsoleEmailPayload {
  to: string;
  subject: string;
  template: string;
  props: EmailJobData["props"];
  text?: string;
}

export function logEmailToConsole({
  to,
  subject,
  template,
  props,
}: ConsoleEmailPayload) {
  const p = props as {
    actionUrl?: string;
    token?: string;
  };

  const actionUrl = p.actionUrl;
  const token = p.token;

  console.log("\n" + "═".repeat(64));
  console.log(" ✉️  [LOCAL WORKER] Transactional Email Dispatched");
  console.log("─".repeat(64));
  console.log(` To:       ${to}`);
  console.log(` Subject:  ${subject}`);
  console.log(` Template: ${template}`);
  if (token) {
    console.log(` Code:     ${token}`);
  }
  if (actionUrl) {
    console.log(` Action:   \x1b[36m\x1b[4m${actionUrl}\x1b[0m`);
  }
  console.log("═".repeat(64) + "\n");
}
