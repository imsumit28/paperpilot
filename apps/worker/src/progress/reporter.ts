import {
  STEP_LABELS,
  type GenerationStep,
  type JobProgressPayload,
  type JobCompletePayload,
  type JobFailedPayload,
  type QuestionPaper,
} from '@paper-pilot/shared';
import { env } from '../config/env';
import { logger } from '../config/logger';

interface ReporterCtx {
  assignmentId: string;
  jobId: string;
}

type PayloadWithKind =
  | ({ kind: 'progress' } & JobProgressPayload)
  | ({ kind: 'complete' } & JobCompletePayload)
  | ({ kind: 'failed' } & JobFailedPayload);

async function postToApi(payload: PayloadWithKind): Promise<void> {
  try {
    const res = await fetch(`${env.INTERNAL_API_URL}/internal/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': env.INTERNAL_SECRET,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      logger.warn({ status: res.status, body: text }, 'Progress POST failed');
    }
  } catch (err) {
    // Progress reporting is fire-and-forget — never let a network blip kill a job.
    logger.warn({ err }, 'Progress POST threw');
  }
}

export class ProgressReporter {
  constructor(private readonly ctx: ReporterCtx) {}

  async progress(percent: number, step: GenerationStep, message?: string) {
    const payload: PayloadWithKind = {
      kind: 'progress',
      assignmentId: this.ctx.assignmentId,
      jobId: this.ctx.jobId,
      percent: Math.max(0, Math.min(100, Math.round(percent))),
      step,
      message: message ?? STEP_LABELS[step],
      at: Date.now(),
    };
    logger.debug(payload, 'progress');
    await postToApi(payload);
  }

  async complete(paper: QuestionPaper) {
    await postToApi({
      kind: 'complete',
      assignmentId: this.ctx.assignmentId,
      jobId: this.ctx.jobId,
      paper,
      at: Date.now(),
    });
  }

  async fail(code: string, message: string) {
    await postToApi({
      kind: 'failed',
      assignmentId: this.ctx.assignmentId,
      jobId: this.ctx.jobId,
      code,
      message,
      at: Date.now(),
    });
  }
}
