import { getStorageCleanupQueue } from "../queues";
import { type StorageCleanupJobData, StorageCleanupJobSchema } from "../types";

export async function enqueueStorageCleanup(
  data: StorageCleanupJobData,
): Promise<{ success: boolean; jobId: string }> {
  StorageCleanupJobSchema.parse(data);
  const job = await getStorageCleanupQueue().add(data.jobType, data, {
    jobId: data.idempotencyKey,
  });

  return { success: true, jobId: String(job.id) };
}
