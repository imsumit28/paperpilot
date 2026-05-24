import IORedis, { type Redis, type RedisOptions } from 'ioredis';
import { env } from './env';
import { logger } from './logger';

const baseOpts: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
};

function create(label: string): Redis {
  const conn = new IORedis(env.REDIS_URL, baseOpts);
  conn.on('ready', () => logger.info({ label }, 'Redis ready'));
  conn.on('error', (err) => logger.error({ err, label }, 'Redis error'));
  return conn;
}

export const redisQueue: Redis = create('queue');
export const redisPub: Redis = create('pub');

export async function disconnectRedis(): Promise<void> {
  await Promise.allSettled([redisQueue.quit(), redisPub.quit()]);
}
