import { env } from "@hono-commerce/env/worker";

import { createEmailWorker } from "./consumers/email";

console.log("┌────────────────────────────────────────────────────────┐");
console.log("│ 🚀 Hono Commerce Background Worker Initializing...     │");
console.log(`│ Environment: ${env.NODE_ENV.padEnd(41)} │`);
console.log(`│ Redis URL:   ${env.REDIS_URL.padEnd(41)} │`);
console.log("└────────────────────────────────────────────────────────┘");

const emailWorker = createEmailWorker();

console.log("[Worker] Listening for jobs on queue: 'emails'");

async function handleShutdown(signal: string) {
  console.log(`\n[Worker] Received ${signal}. Shutting down gracefully...`);
  try {
    await emailWorker.close();
    console.log("[Worker] Email worker closed. Exiting process.");
    process.exit(0);
  } catch (err) {
    console.error("[Worker] Error during shutdown:", err);
    process.exit(1);
  }
}

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
