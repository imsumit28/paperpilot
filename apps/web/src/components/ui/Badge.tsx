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
