import type { EmailJobData } from "@hono-commerce/queue";

export type ConsoleEmailPayload = EmailJobData & {
  text?: string;
};

export function logEmailToConsole(payload: ConsoleEmailPayload) {
  const actionUrl = payload.props.actionUrl;
  const token =
    payload.template === "magic-link" ? payload.props.token : undefined;

  console.log("\n" + "═".repeat(64));
  console.log(" ✉️  [LOCAL WORKER] Transactional Email Dispatched");
  console.log("─".repeat(64));
  console.log(` To:       ${payload.to}`);
  console.log(` Subject:  ${payload.subject}`);
  console.log(` Template: ${payload.template}`);
  if (token) {
    console.log(` Code:     ${token}`);
  }
  if (actionUrl) {
    console.log(` Action:   \x1b[36m\x1b[4m${actionUrl}\x1b[0m`);
  }
  console.log("═".repeat(64) + "\n");
}
