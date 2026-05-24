export const QUESTION_TYPES = ['mcq', 'short', 'diagram', 'numerical'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq: 'Multiple Choice Questions',
  short: 'Short Questions',
  diagram: 'Diagram/Graph-Based Questions',
  numerical: 'Numerical Problems',
};

export const DIFFICULTIES = ['easy', 'moderate', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const ASSIGNMENT_STATUSES = [
  'pending',
  'processing',
  'completed',
  'failed',
] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const QUEUE_NAMES = {
  generation: 'generation',
  pdf: 'pdf',
} as const;

export const REDIS_CHANNELS = {
  jobProgress: (jobId: string) => `job:${jobId}:progress`,
  jobProgressPattern: 'job:*:progress',
} as const;
