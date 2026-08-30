import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z
      .string()
      .min(1)
      .default("http://localhost:3001,http://localhost:3002"),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    REDIS_URL: z.string().optional(),
    AWS_REGION: z.string().default("us-east-1"),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_S3_BUCKET_NAME: z.string().optional(),
    AWS_S3_ENDPOINT: z.string().optional(),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
