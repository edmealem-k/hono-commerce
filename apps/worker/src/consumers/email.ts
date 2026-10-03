import {
  createRedisConnection,
  type EmailJobData,
  QueueName,
} from "@hono-commerce/queue";
import { type Job, Worker } from "bullmq";

import { renderJobEmail } from "../renderers/email";
import { dispatchEmail } from "../transports";

export function createEmailWorker(): Worker<EmailJobData> {
  const worker = new Worker<EmailJobData>(
    QueueName.EMAILS,
    async (job: Job<EmailJobData>) => {
      console.log(
        `[Worker:Email] Processing job ${job.id} (${job.data.template}) for ${job.data.to}`,
      );

      const { html, text } = await renderJobEmail(job.data);
      await dispatchEmail({ data: job.data, html, text });

      return { delivered: true, recipient: job.data.to };
    },
    {
      connection: createRedisConnection(),
      concurrency: 5,
    },
  );

  worker.on("completed", (job) => {
    console.log(`[Worker:Email] Job ${job.id} completed successfully`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker:Email] Job ${job?.id} failed with error:`, err);
  });

  return worker;
}
