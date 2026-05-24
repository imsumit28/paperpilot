'use client';

import { create } from 'zustand';
import type {
  GenerationStep,
  JobCompletePayload,
  JobFailedPayload,
  JobProgressPayload,
  QuestionPaper,
} from '@paper-pilot/shared';

interface GenerationState {
  assignmentId: string | null;
  jobId: string | null;
  title: string | null;
  percent: number;
  step: GenerationStep | null;
  message: string;
  status: 'idle' | 'subscribed' | 'progress' | 'complete' | 'failed';
  paper: QuestionPaper | null;
  error: { code: string; message: string } | null;
  start: (assignmentId: string, jobId: string, title?: string) => void;
  applyProgress: (p: JobProgressPayload) => void;
  applyComplete: (p: JobCompletePayload) => void;
  applyFailed: (p: JobFailedPayload) => void;
  reset: () => void;
}

const initial = {
  assignmentId: null,
  jobId: null,
  title: null as string | null,
  percent: 0,
  step: null as GenerationStep | null,
  message: '',
  status: 'idle' as const,
  paper: null,
  error: null,
};

export const useGenerationStore = create<GenerationState>((set) => ({
  ...initial,
  start: (assignmentId, jobId, title) =>
    set({
      ...initial,
      assignmentId,
      jobId,
      title: title ?? null,
      status: 'subscribed',
      message: 'Connecting...',
    }),
  applyProgress: (p) =>
    set({
      assignmentId: p.assignmentId,
      jobId: p.jobId,
      percent: p.percent,
      step: p.step,
      message: p.message,
      status: 'progress',
    }),
  applyComplete: (p) =>
    set({
      assignmentId: p.assignmentId,
      jobId: p.jobId,
      percent: 100,
      status: 'complete',
      paper: p.paper,
    }),
  applyFailed: (p) =>
    set({
      assignmentId: p.assignmentId,
      jobId: p.jobId,
      status: 'failed',
      error: { code: p.code, message: p.message },
    }),
  reset: () => set({ ...initial }),
}));
