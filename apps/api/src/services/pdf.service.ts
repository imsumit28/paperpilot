import { redisQueue } from '../config/redis';
import { pdfQueue } from '../queues/pdf.queue';
import { notFound } from '../middleware/errorHandler';
import { AssignmentModel } from '../models/Assignment.model';
import { logger } from '../config/logger';

const PDF_KEY = (id: string) => `pdf:${id}`;
const PDF_TTL_SECONDS = 60 * 60 * 24; // 1 day
const PDF_WAIT_TIMEOUT_MS = 45_000;
const PDF_POLL_INTERVAL_MS = 500;

/** Confirms the assignment belongs to this device, else throws 404. */
async function assertOwned(deviceId: string, id: string): Promise<void> {
  const owned = await AssignmentModel.exists({ _id: id, deviceId });
  if (!owned) throw notFound('Assignment not found');
}

export async function getCachedPdf(deviceId: string, id: string): Promise<Buffer | null> {
  await assertOwned(deviceId, id);
  const raw = await redisQueue.getBuffer(PDF_KEY(id));
  return raw ?? null;
}

export async function ensurePdf(deviceId: string, id: string): Promise<Buffer> {
  const doc = await AssignmentModel.findOne({ _id: id, deviceId });
  if (!doc) throw notFound('Assignment not found');

  const cached = await redisQueue.getBuffer(PDF_KEY(id));
  if (cached) return cached;

  if (doc.status !== 'completed' || !doc.paper) {
    const err: Error & { status?: number; code?: string } = new Error('Paper not ready yet');
    err.status = 409;
    err.code = 'NOT_READY';
    throw err;
  }

  // Flip the flag off so we can poll Mongo for it flipping back on. Mongo
  // queries are free; the prior approach used QueueEvents which kept a
  // continuous XREAD polling loop on Upstash.
  if (doc.pdfReady) {
    await AssignmentModel.updateOne({ _id: id }, { $set: { pdfReady: false } });
  }

  await pdfQueue.add(
    'pdf',
    { assignmentId: id },
    { jobId: `pdf-${id}-${Date.now()}` },
  );

  const startedAt = Date.now();
  while (Date.now() - startedAt < PDF_WAIT_TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, PDF_POLL_INTERVAL_MS));
    const fresh = await AssignmentModel.findById(id).select('pdfReady').lean();
    if (fresh?.pdfReady) {
      const buf = await redisQueue.getBuffer(PDF_KEY(id));
      if (buf) return buf;
      // pdfReady was set but the cache buffer is missing — treat as a failure.
      logger.warn({ id }, 'pdfReady true but Redis cache missing');
      break;
    }
  }

  const e: Error & { status?: number; code?: string } = new Error('PDF generation timed out');
  e.status = 504;
  e.code = 'PDF_TIMEOUT';
  throw e;
}

export const PDF_CACHE = { key: PDF_KEY, ttlSeconds: PDF_TTL_SECONDS };
