import IORedis, { type Redis, type RedisOptions } from 'ioredis';
import { env } from './env';
import { logger } from './logger';

const baseOpts: RedisOptions = {
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck: true,
  lazyConnect: false,
};

function create(label: string): Redis {
  const conn = new IORedis(env.REDIS_URL, baseOpts);
  conn.on('connect', () => logger.info({ label }, 'Redis connect'));
  conn.on('ready', () => logger.info({ label }, 'Redis ready'));
  conn.on('error', (err) => logger.error({ err, label }, 'Redis error'));
  conn.on('end', () => logger.warn({ label }, 'Redis connection ended'));
  return conn;
}

// Single connection — BullMQ Queue and PDF cache reads share it. Progress
// updates now flow worker -> API over HTTP, so Pub/Sub connections are gone.
export const redisQueue: Redis = create('queue');

export async function disconnectRedis(): Promise<void> {
  await Promise.allSettled([redisQueue.quit()]);
}
