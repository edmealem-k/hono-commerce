import { Redis, type RedisOptions } from "ioredis";

let redisClient: Redis | null = null;

export function getRedisConnection(
  redisUrl?: string,
  options?: RedisOptions,
): Redis {
  if (redisClient) {
    return redisClient;
  }

  const url = redisUrl || process.env.REDIS_URL || "redis://localhost:6379";
  redisClient = new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    ...options,
  });

  return redisClient;
}

export function createRedisConnection(
  redisUrl?: string,
  options?: RedisOptions,
): Redis {
  const url = redisUrl || process.env.REDIS_URL || "redis://localhost:6379";
  return new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    ...options,
  });
}
