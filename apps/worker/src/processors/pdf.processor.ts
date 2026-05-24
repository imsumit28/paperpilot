import type { Job } from 'bullmq';
import { AssignmentModel } from '../models/Assignment.model';
import { renderPaperToPdf } from '../pdf/renderer';
import { redisQueue } from '../config/redis';
import { ProgressReporter } from '../progress/reporter';
import { QuestionPaperSchema, type QuestionPaper } from '@paper-pilot/shared';
import { logger } from '../config/logger';

export interface PdfJobData {
  assignmentId: string;
}

const PDF_KEY = (id: string) => `pdf:${id}`;
const PDF_TTL_SECONDS = 60 * 60 * 24;

export async function processPdfJob(job: Job<PdfJobData>) {
  const { assignmentId } = job.data;
  const reporter = new ProgressReporter({ assignmentId, jobId: String(job.id) });

  const doc = await AssignmentModel.findById(assignmentId);
  if (!doc || !doc.paper) {
    await reporter.fail('NOT_READY', 'Assignment paper not ready for PDF');
    throw new Error('Paper not ready');
  }

  // Re-validate before rendering — defense in depth
  const parsed = QuestionPaperSchema.safeParse(doc.paper);
  if (!parsed.success) {
    const msg = parsed.error.issues.slice(0, 3).map((i) => i.message).join('; ');
    await reporter.fail('INVALID_PAPER', `Stored paper is invalid: ${msg}`);
    throw new Error('Invalid paper for PDF');
  }

  await reporter.progress(20, 'pdf_rendering', 'Building PDF...');
  const buffer = await renderPaperToPdf(parsed.data as QuestionPaper);

  await redisQueue.set(PDF_KEY(assignmentId), buffer, 'EX', PDF_TTL_SECONDS);
  doc.pdfReady = true;
  await doc.save();

  await reporter.progress(100, 'pdf_rendering', 'PDF ready');
  logger.info({ assignmentId, bytes: buffer.length }, 'PDF cached');
}
