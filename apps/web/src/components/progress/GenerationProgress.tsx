'use client';

import { Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { STEP_LABELS, type GenerationStep } from '@paper-pilot/shared';
import { useGenerationStore } from '@/store/useGenerationStore';
import { Button } from '@/components/ui/Button';

const STEP_ORDER: GenerationStep[] = [
  'analyzing',
  'building_prompt',
  'generating',
  'parsing',
  'refining',
  'sectioning',
  'saving',
  'complete',
];

interface Props {
  onRetry?: () => void;
}

export function GenerationProgress({ onRetry }: Props) {
  const { percent, step, message, status, error } = useGenerationStore();
  const currentIndex = step ? STEP_ORDER.indexOf(step) : -1;

  return (
    <div className="bg-white rounded-3xl border border-border/60 shadow-card p-6 sm:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
          {status === 'failed' ? (
            <AlertCircle className="h-5 w-5" />
          ) : status === 'complete' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <Sparkles className="h-5 w-5 animate-pulse" />
          )}
        </div>
        <div>
          <div className="font-bold text-ink">
            {status === 'failed'
              ? 'Generation failed'
              : status === 'complete'
                ? 'All set!'
                : 'Crafting your question paper'}
          </div>
          <div className="text-sm text-ink-muted">{message || 'Connecting...'}</div>
        </div>
      </div>

      <div className="w-full h-2 bg-surface-alt rounded-full overflow-hidden mb-1">
        <div
          className="h-full bg-gradient-to-r from-brand-400 to-brand transition-all duration-500"
          style={{ width: `${Math.max(4, percent)}%` }}
        />
      </div>
      <div className="text-right text-xs text-ink-muted mb-6 tabular-nums">{percent}%</div>

      <ol className="space-y-2.5">
        {STEP_ORDER.filter((s) => s !== 'refining' || step === 'refining').map((s, idx) => {
          const done = currentIndex > idx || status === 'complete';
          const current = currentIndex === idx && status !== 'complete' && status !== 'failed';
          return (
            <li key={s} className="flex items-center gap-3 text-sm">
              <span
                className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                  done
                    ? 'bg-emerald-500 text-white'
                    : current
                      ? 'bg-brand text-white'
                      : 'bg-surface-alt text-ink-subtle border border-border'
                }`}
              >
                {done ? '✓' : current ? <Loader2 className="h-3 w-3 animate-spin" /> : idx + 1}
              </span>
              <span className={done ? 'text-ink-muted line-through' : current ? 'text-ink font-medium' : 'text-ink-subtle'}>
                {STEP_LABELS[s]}
              </span>
            </li>
          );
        })}
      </ol>

      {status === 'failed' && error && (
        <div className="mt-6 rounded-2xl bg-red-50 border border-red-200 p-4 overflow-hidden">
          <div className="text-sm font-semibold text-red-700 break-words">{error.code}</div>
          <div className="text-sm text-red-600 mt-1 break-words">{error.message}</div>
          {onRetry && (
            <Button variant="danger" className="mt-3" onClick={onRetry}>
              Retry generation
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
