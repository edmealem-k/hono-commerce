import { getEmailQueue } from "../queues";
import {
  type EmailJobData,
  type EmailTemplate,
  EmailJobSchema,
  type EnqueueEmailOptions,
} from "../types";

export async function enqueueEmail<T extends EmailTemplate>(
  data: EmailJobData<T>,
  options?: EnqueueEmailOptions,
): Promise<{ success: boolean; jobId: string }> {
  EmailJobSchema.parse(data);
  const queue = getEmailQueue();

  const jobId = options?.jobId || data.idempotencyKey || undefined;

  const job = await queue.add(data.template, data, {
    jobId,
    delay: options?.delay,
    priority: options?.priority,
  });

  return {
    success: true,
    jobId: String(job.id),
  };
}
