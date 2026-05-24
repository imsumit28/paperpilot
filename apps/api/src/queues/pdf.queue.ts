import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '@paper-pilot/shared';
import { redisQueue } from '../config/redis';

export interface PdfJobData {
  assignmentId: string;
}

export const pdfQueue = new Queue<PdfJobData>(QUEUE_NAMES.pdf, {
  connection: redisQueue,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 3600, count: 100 },
    removeOnFail: { age: 86_400 },
  },
});
