'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CounterProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  className?: string;
  ariaLabel?: string;
}

export function Counter({ value, onChange, min = 1, max = 50, className, ariaLabel }: CounterProps) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border bg-white px-1.5 py-1 text-sm',
        className,
      )}
      aria-label={ariaLabel}
    >
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        className="h-7 w-7 rounded-full hover:bg-surface-alt disabled:opacity-30 flex items-center justify-center"
        aria-label="Decrement"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-[24px] text-center font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        className="h-7 w-7 rounded-full hover:bg-surface-alt disabled:opacity-30 flex items-center justify-center"
        aria-label="Increment"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
