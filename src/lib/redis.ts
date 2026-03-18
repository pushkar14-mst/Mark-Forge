import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | null = null;

async function getRedis(): Promise<RedisClientType> {
  if (client) return client;
  client = createClient({ url: process.env.REDIS_URL }) as RedisClientType;
  client.on("error", (err) => console.error("[redis]", err));
  await client.connect();
  return client;
}

export default getRedis;
