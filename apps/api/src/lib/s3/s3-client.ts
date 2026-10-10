import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@hono-commerce/env/api";

let s3ClientInstance: S3Client | null = null;

export function getS3Client(): S3Client {
  if (s3ClientInstance) {
    return s3ClientInstance;
  }

  const credentials =
    env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined;

  s3ClientInstance = new S3Client({
    region: env.AWS_REGION || "us-east-1",
    credentials,
    endpoint: env.AWS_S3_ENDPOINT || undefined,
    forcePathStyle: env.AWS_S3_FORCE_PATH_STYLE || Boolean(env.AWS_S3_ENDPOINT),
  });

  return s3ClientInstance;
}
