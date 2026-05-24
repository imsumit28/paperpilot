import type { QuestionPaper } from '../schemas/question-paper.schema';

export const SOCKET_EVENTS = {
  // client -> server
  SUBSCRIBE_JOB: 'subscribe:job',
  UNSUBSCRIBE_JOB: 'unsubscribe:job',
  // server -> client
  JOB_PROGRESS: 'job:progress',
  JOB_COMPLETE: 'job:complete',
  JOB_FAILED: 'job:failed',
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

export const GENERATION_STEPS = [
  'analyzing',
  'building_prompt',
  'generating',
  'parsing',
  'refining',
  'sectioning',
  'saving',
  'complete',
  'pdf_rendering',
] as const;
export type GenerationStep = (typeof GENERATION_STEPS)[number];

export const STEP_LABELS: Record<GenerationStep, string> = {
  analyzing: 'Analyzing your inputs...',
  building_prompt: 'Building structured prompt...',
  generating: 'Generating with AI...',
  parsing: 'Parsing question structure...',
  refining: 'Refining structure...',
  sectioning: 'Creating sections...',
  saving: 'Saving to database...',
  complete: 'Complete!',
  pdf_rendering: 'Finalizing PDF...',
};

export interface JobProgressPayload {
  assignmentId: string;
  jobId: string;
  percent: number;
  step: GenerationStep;
  message: string;
  at: number;
}

export interface JobCompletePayload {
  assignmentId: string;
  jobId: string;
  paper: QuestionPaper;
  at: number;
}

export interface JobFailedPayload {
  assignmentId: string;
  jobId: string;
  code: string;
  message: string;
  at: number;
}

export interface SubscribePayload {
  assignmentId: string;
}
