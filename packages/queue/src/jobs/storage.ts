import { z } from "zod";

export const StorageCleanupJobSchema = z.object({
  jobType: z.literal("storage-cleanup"),
  tenantId: z.string().uuid(),
  fileId: z.string().uuid(),
  s3Key: z.string().min(1),
  idempotencyKey: z.string().min(1),
});

export type StorageCleanupJobData = z.infer<typeof StorageCleanupJobSchema>;
