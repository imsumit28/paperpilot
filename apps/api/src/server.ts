import { createServer } from 'node:http';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectMongo, disconnectMongo } from './config/db';
import { disconnectRedis } from './config/redis';
import { createApp } from './app';
import { initSockets } from './sockets';

async function main() {
  await connectMongo();

  const app = createApp();
  const httpServer = createServer(app);
  initSockets(httpServer);

  const port = Number(process.env.PORT) || env.API_PORT;
  httpServer.listen(port, () => {
    logger.info({ port, env: env.NODE_ENV }, 'API listening');
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down…');
    httpServer.close();
    await disconnectMongo();
    await disconnectRedis();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('unhandledRejection', (err) => logger.error({ err }, 'Unhandled rejection'));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('API failed to start', err);
  process.exit(1);
});
