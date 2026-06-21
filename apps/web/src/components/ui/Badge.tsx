import * as React from 'react';
import { cn } from '@/lib/utils';
import type { Difficulty } from '@paper-pilot/shared';

export function Badge({ className, ...rest }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        className,
      )}
      {...rest}
    />
  );
}

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  easy: 'bg-difficulty-easy-bg text-difficulty-easy',
  moderate: 'bg-difficulty-moderate-bg text-difficulty-moderate',
  hard: 'bg-difficulty-hard-bg text-difficulty-hard',
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  hard: 'Hard',
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <Badge className={DIFFICULTY_STYLES[difficulty]}>{DIFFICULTY_LABELS[difficulty]}</Badge>;
}

export type AssignmentStatus = 'pending' | 'processing' | 'completed' | 'failed';

const STATUS_STYLES: Record<AssignmentStatus, { dot: string; pill: string; label: string }> = {
  pending: { dot: 'bg-status-pending', pill: 'bg-status-pending-bg text-status-pending', label: 'Queued' },
  processing: {
    dot: 'bg-status-processing animate-pulse',
    pill: 'bg-status-processing-bg text-status-processing',
    label: 'Generating…',
  },
  completed: { dot: 'bg-status-ready', pill: 'bg-status-ready-bg text-status-ready', label: 'Ready' },
  failed: { dot: 'bg-status-failed', pill: 'bg-status-failed-bg text-status-failed', label: 'Failed' },
};

export function StatusBadge({ status }: { status: AssignmentStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <Badge className={s.pill}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      {s.label}
    </Badge>
  );
}
