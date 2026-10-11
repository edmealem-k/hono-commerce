import { and, db, eq, inArray, lte } from "@hono-commerce/db";
import { fileAsset } from "@hono-commerce/db/schema/files";
import {
  createRedisConnection,
  enqueueStorageCleanup,
  type StorageCleanupJobData,
  QueueName,
} from "@hono-commerce/queue";
import { type Job, Worker } from "bullmq";

import { deleteS3Object } from "../lib/s3";

export function createStorageCleanupWorker(): Worker<StorageCleanupJobData> {
  return new Worker<StorageCleanupJobData>(
    QueueName.STORAGE_CLEANUP,
    async (job: Job<StorageCleanupJobData>) => {
      const { tenantId, fileId, s3Key } = job.data;
      await deleteS3Object(s3Key);
      await db
        .update(fileAsset)
        .set({ status: "purged", purgedAt: new Date() })
        .where(
          and(
            eq(fileAsset.id, fileId),
            eq(fileAsset.tenantId, tenantId),
            eq(fileAsset.status, "delete_pending"),
          ),
        );
      return { fileId };
    },
    { connection: createRedisConnection() },
  );
}

export async function runStorageExpirySweep(): Promise<number> {
  const expired = await db
    .select({
      fileId: fileAsset.id,
      tenantId: fileAsset.tenantId,
      s3Key: fileAsset.s3Key,
    })
    .from(fileAsset)
    .where(
      and(
        inArray(fileAsset.status, ["pending_upload", "signed"]),
        lte(fileAsset.uploadExpiresAt, new Date()),
      ),
    );

  for (const file of expired) {
    await db
      .update(fileAsset)
      .set({ status: "delete_pending", lastStorageError: "UPLOAD_EXPIRED" })
      .where(
        and(
          eq(fileAsset.id, file.fileId),
          inArray(fileAsset.status, ["pending_upload", "signed"]),
        ),
      );
    await enqueueStorageCleanup({
      jobType: "storage-cleanup",
      tenantId: file.tenantId,
      fileId: file.fileId,
      s3Key: file.s3Key,
      idempotencyKey: `storage-expiry:${file.tenantId}:${file.fileId}`,
    });
  }

  return expired.length;
}
