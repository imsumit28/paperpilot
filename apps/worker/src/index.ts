import { Worker } from 'bullmq';
import { QUEUE_NAMES } from '@paper-pilot/shared';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectMongo, disconnectMongo } from './config/db';
import { redisQueue, disconnectRedis } from './config/redis';
import { processGenerationJob, type GenerationJobData } from './processors/generation.processor';
import { processPdfJob, type PdfJobData } from './processors/pdf.processor';

async function main() {
  await connectMongo();

  const generationWorker = new Worker<GenerationJobData>(
    QUEUE_NAMES.generation,
    processGenerationJob,
    {
      connection: redisQueue,
      concurrency: env.WORKER_CONCURRENCY,
    },
  );

  const pdfWorker = new Worker<PdfJobData>(QUEUE_NAMES.pdf, processPdfJob, {
    connection: redisQueue,
    concurrency: 1,
  });

  for (const [name, w] of [
    ['generation', generationWorker],
    ['pdf', pdfWorker],
  ] as const) {
    w.on('completed', (job) => logger.info({ name, jobId: job.id }, 'job completed'));
    w.on('failed', (job, err) =>
      logger.error({ name, jobId: job?.id, err: err.message }, 'job failed'),
    );
    w.on('error', (err) => logger.error({ name, err }, 'worker error'));
  }

  logger.info(
    { concurrency: env.WORKER_CONCURRENCY, queues: Object.values(QUEUE_NAMES) },
    'Worker started',
  );

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Worker shutting down…');
    await Promise.allSettled([generationWorker.close(), pdfWorker.close()]);
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
  console.error('Worker failed to start', err);
  process.exit(1);
});
