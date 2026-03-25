import { Redis as UpstashRedis } from "@upstash/redis";
import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | UpstashRedis | undefined;
};

const createRedisInstance = () => {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.log("🔌 Using Upstash Redis (REST)");
    return new UpstashRedis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  console.log("🔌 Using Standard Redis (TCP):", process.env.REDIS_URL || "localhost");
  return new Redis(process.env.REDIS_URL || "redis://localhost:6379");
};

export const redis = globalForRedis.redis ?? createRedisInstance();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
