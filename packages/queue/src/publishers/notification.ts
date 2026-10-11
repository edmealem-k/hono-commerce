import { getNotificationQueue } from "../queues";
import {
  type EnqueueNotificationOptions,
  type NotificationJobData,
  NotificationJobSchema,
} from "../types";

export async function enqueueNotificationFanout(
  data: NotificationJobData,
  options?: EnqueueNotificationOptions,
): Promise<{ success: boolean; jobId: string }> {
  NotificationJobSchema.parse(data);
  const queue = getNotificationQueue();

  const jobId = options?.jobId || data.idempotencyKey || undefined;

  const job = await queue.add(data.jobType, data, {
    jobId,
    delay: options?.delay,
    priority: options?.priority,
  });

  return {
    success: true,
    jobId: String(job.id),
  };
}
