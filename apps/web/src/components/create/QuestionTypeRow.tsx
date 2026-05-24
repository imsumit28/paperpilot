'use client';

import { X } from 'lucide-react';
import { QUESTION_TYPE_LABELS, QUESTION_TYPES, type QuestionType } from '@paper-pilot/shared';
import { Select } from '@/components/ui/Select';
import { Counter } from '@/components/ui/Counter';

interface Props {
  index: number;
  type: QuestionType;
  count: number;
  marks: number;
  takenTypes: QuestionType[];
  onChange: (patch: Partial<{ type: QuestionType; count: number; marks: number }>) => void;
  onRemove: () => void;
}

export function QuestionTypeRow({ type, count, marks, takenTypes, onChange, onRemove }: Props) {
  const options = QUESTION_TYPES.map((t) => ({
    label: QUESTION_TYPE_LABELS[t],
    value: t,
  })).filter((o) => o.value === type || !takenTypes.includes(o.value));

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] items-center gap-3 py-3 border-b border-border/60 last:border-0">
      <div className="flex items-center gap-2">
        <Select
          value={type}
          onChange={(e) => onChange({ type: e.target.value as QuestionType })}
          options={options}
        />
      </div>
      <div className="flex items-center md:gap-2">
        <span className="text-xs text-ink-muted md:w-24 md:text-right md:mr-1">No. of Questions</span>
        <Counter value={count} onChange={(n) => onChange({ count: n })} min={1} max={30} />
      </div>
      <div className="flex items-center md:gap-2">
        <span className="text-xs text-ink-muted md:w-12 md:text-right md:mr-1">Marks</span>
        <Counter value={marks} onChange={(n) => onChange({ marks: n })} min={1} max={20} />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="justify-self-end md:justify-self-start h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-ink-muted"
        aria-label="Remove row"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
