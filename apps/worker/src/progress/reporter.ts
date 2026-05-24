import {
  REDIS_CHANNELS,
  STEP_LABELS,
  type GenerationStep,
  type JobProgressPayload,
  type JobCompletePayload,
  type JobFailedPayload,
  type QuestionPaper,
} from '@paper-pilot/shared';
import { redisPub } from '../config/redis';
import { logger } from '../config/logger';

interface ReporterCtx {
  assignmentId: string;
  jobId: string;
}

export class ProgressReporter {
  constructor(private readonly ctx: ReporterCtx) {}

  async progress(percent: number, step: GenerationStep, message?: string) {
    const payload: JobProgressPayload & { kind: 'progress' } = {
      kind: 'progress',
      assignmentId: this.ctx.assignmentId,
      jobId: this.ctx.jobId,
      percent: Math.max(0, Math.min(100, Math.round(percent))),
      step,
      message: message ?? STEP_LABELS[step],
      at: Date.now(),
    };
    logger.debug(payload, 'progress');
    await redisPub.publish(REDIS_CHANNELS.jobProgress(this.ctx.assignmentId), JSON.stringify(payload));
  }

  async complete(paper: QuestionPaper) {
    const payload: JobCompletePayload & { kind: 'complete' } = {
      kind: 'complete',
      assignmentId: this.ctx.assignmentId,
      jobId: this.ctx.jobId,
      paper,
      at: Date.now(),
    };
    await redisPub.publish(REDIS_CHANNELS.jobProgress(this.ctx.assignmentId), JSON.stringify(payload));
  }

  async fail(code: string, message: string) {
    const payload: JobFailedPayload & { kind: 'failed' } = {
      kind: 'failed',
      assignmentId: this.ctx.assignmentId,
      jobId: this.ctx.jobId,
      code,
      message,
      at: Date.now(),
    };
    await redisPub.publish(REDIS_CHANNELS.jobProgress(this.ctx.assignmentId), JSON.stringify(payload));
  }
}
