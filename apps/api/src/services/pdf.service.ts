import { QueueEvents } from 'bullmq';
import { QUEUE_NAMES } from '@paper-pilot/shared';
import { redisQueue } from '../config/redis';
import { pdfQueue } from '../queues/pdf.queue';
import { notFound } from '../middleware/errorHandler';
import { AssignmentModel } from '../models/Assignment.model';
import { logger } from '../config/logger';

const PDF_KEY = (id: string) => `pdf:${id}`;
const PDF_TTL_SECONDS = 60 * 60 * 24; // 1 day

const pdfQueueEvents = new QueueEvents(QUEUE_NAMES.pdf, {
  connection: redisQueue.duplicate(),
});

pdfQueueEvents.on('completed', ({ jobId }) => logger.debug({ jobId }, 'pdf job completed'));
pdfQueueEvents.on('failed', ({ jobId, failedReason }) =>
  logger.warn({ jobId, failedReason }, 'pdf job failed'),
);

export async function getCachedPdf(id: string): Promise<Buffer | null> {
  const raw = await redisQueue.getBuffer(PDF_KEY(id));
  return raw ?? null;
}

export async function ensurePdf(id: string): Promise<Buffer> {
  const cached = await getCachedPdf(id);
  if (cached) return cached;

  const doc = await AssignmentModel.findById(id);
  if (!doc) throw notFound('Assignment not found');
  if (doc.status !== 'completed' || !doc.paper) {
    const err: Error & { status?: number; code?: string } = new Error('Paper not ready yet');
    err.status = 409;
    err.code = 'NOT_READY';
    throw err;
  }

  const job = await pdfQueue.add(
    'pdf',
    { assignmentId: id },
    { jobId: `pdf-${id}-${Date.now()}` },
  );

  try {
    await job.waitUntilFinished(pdfQueueEvents, 45_000);
  } catch (err) {
    logger.error({ err, id }, 'PDF job did not finish in time');
    const e: Error & { status?: number; code?: string } = new Error('PDF generation timed out');
    e.status = 504;
    e.code = 'PDF_TIMEOUT';
    throw e;
  }

  const buf = await getCachedPdf(id);
  if (!buf) {
    const e: Error & { status?: number; code?: string } = new Error('PDF generation failed');
    e.status = 500;
    e.code = 'PDF_FAILED';
    throw e;
  }
  return buf;
}

export const PDF_CACHE = { key: PDF_KEY, ttlSeconds: PDF_TTL_SECONDS };
