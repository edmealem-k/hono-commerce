import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "@hono-commerce/env/worker";

let client: S3Client | null = null;

function getS3Client(): S3Client {
  if (client) return client;
  const credentials =
    env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined;
  client = new S3Client({
    region: env.AWS_REGION,
    credentials,
    endpoint: env.AWS_S3_ENDPOINT || undefined,
    forcePathStyle: env.AWS_S3_FORCE_PATH_STYLE || Boolean(env.AWS_S3_ENDPOINT),
  });
  return client;
}

export async function deleteS3Object(s3Key: string): Promise<void> {
  await getS3Client().send(
    new DeleteObjectCommand({ Bucket: env.AWS_S3_BUCKET_NAME, Key: s3Key }),
  );
}
