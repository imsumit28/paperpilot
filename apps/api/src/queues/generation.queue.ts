import { Queue, QueueEvents } from 'bullmq';
import { QUEUE_NAMES } from '@paper-pilot/shared';
import { redisQueue } from '../config/redis';
import { logger } from '../config/logger';

export interface GenerationJobData {
  assignmentId: string;
  regenerate?: boolean;
}

export const generationQueue = new Queue<GenerationJobData>(QUEUE_NAMES.generation, {
  connection: redisQueue,
  defaultJobOptions: {
    attempts: 1, // we handle retries inside the worker for finer control
    removeOnComplete: { age: 3600, count: 200 },
    removeOnFail: { age: 86_400, count: 500 },
  },
});

export const generationQueueEvents = new QueueEvents(QUEUE_NAMES.generation, {
  connection: redisQueue.duplicate(),
});

generationQueueEvents.on('completed', ({ jobId }) =>
  logger.info({ jobId }, 'queue:job completed'),
);
generationQueueEvents.on('failed', ({ jobId, failedReason }) =>
  logger.warn({ jobId, failedReason }, 'queue:job failed'),
);
