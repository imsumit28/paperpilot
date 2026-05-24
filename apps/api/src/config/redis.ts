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

// Three logical connections: BullMQ requires its own; pub/sub need separate connections.
export const redisQueue: Redis = create('queue');
export const redisPub: Redis = create('pub');
export const redisSub: Redis = create('sub');

export async function disconnectRedis(): Promise<void> {
  await Promise.allSettled([redisQueue.quit(), redisPub.quit(), redisSub.quit()]);
}
