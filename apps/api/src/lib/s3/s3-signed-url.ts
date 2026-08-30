import {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@hono-commerce/env/api";

import { getS3Client } from "./s3-client";

export const DEFAULT_READ_EXPIRY_SECONDS = 3600; // 1 hour
export const DEFAULT_UPLOAD_EXPIRY_SECONDS = 900; // 15 minutes

export async function getReadSignedUrl(
  s3Key: string | undefined | null,
  expiresIn = DEFAULT_READ_EXPIRY_SECONDS,
): Promise<string | null> {
  if (!s3Key) return null;

  // Direct public URL or local blob passthrough
  if (
    s3Key.startsWith("http://") ||
    s3Key.startsWith("https://") ||
    s3Key.startsWith("blob:")
  ) {
    return s3Key;
  }

  const bucket = env.AWS_S3_BUCKET_NAME;
  if (!bucket) {
    console.warn(
      "AWS_S3_BUCKET_NAME is not configured. Returning fallback key.",
    );
    return s3Key;
  }

  try {
    const client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: s3Key,
    });

    return await getSignedUrl(client, command, { expiresIn });
  } catch (error) {
    console.error("Error generating S3 read signed URL for key:", s3Key, error);
    return null;
  }
}

export async function getUploadPresignedUrl({
  s3Key,
  contentType,
  expiresIn = DEFAULT_UPLOAD_EXPIRY_SECONDS,
}: {
  s3Key: string;
  contentType: string;
  expiresIn?: number;
}): Promise<{ uploadUrl: string; s3Key: string } | null> {
  const bucket = env.AWS_S3_BUCKET_NAME;
  if (!bucket) {
    console.error("AWS_S3_BUCKET_NAME is not configured.");
    return null;
  }

  try {
    const client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn });
    return { uploadUrl, s3Key };
  } catch (error) {
    console.error("Error generating S3 presigned upload URL:", error);
    return null;
  }
}

export async function deleteS3Object(s3Key: string): Promise<boolean> {
  const bucket = env.AWS_S3_BUCKET_NAME;
  if (!bucket || !s3Key) return false;

  try {
    const client = getS3Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: s3Key,
      }),
    );
    return true;
  } catch (error) {
    console.error("Error deleting S3 object:", s3Key, error);
    return false;
  }
}
