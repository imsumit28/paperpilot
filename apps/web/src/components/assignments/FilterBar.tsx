'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

export type AssignmentStatusFilter = 'all' | 'completed' | 'in-progress' | 'failed';
export type AssignmentSortOption = 'newest' | 'oldest' | 'due-soonest' | 'updated' | 'title-asc';

export interface FilterBarValue {
  status: AssignmentStatusFilter;
  subject: string;
  className: string;
  sort: AssignmentSortOption;
}

interface Props {
  query: string;
  onQueryChange: (v: string) => void;
  value: FilterBarValue;
  onValueChange: (v: FilterBarValue) => void;
  subjects?: string[];
  classes?: string[];
}

const STATUS_OPTIONS: Array<{ value: AssignmentStatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Ready' },
  { value: 'in-progress', label: 'Generating' },
  { value: 'failed', label: 'Failed' },
];

const SORT_OPTIONS: Array<{ value: AssignmentSortOption; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'due-soonest', label: 'Due soonest' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'title-asc', label: 'Title (A–Z)' },
];

export const DEFAULT_FILTER_VALUE: FilterBarValue = {
  status: 'all',
  subject: 'all',
  className: 'all',
  sort: 'newest',
};

export function FilterBar({
  query,
  onQueryChange,
  value,
  onValueChange,
  subjects = [],
  classes = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const isDefault =
    value.status === DEFAULT_FILTER_VALUE.status &&
    value.subject === DEFAULT_FILTER_VALUE.subject &&
    value.className === DEFAULT_FILTER_VALUE.className &&
    value.sort === DEFAULT_FILTER_VALUE.sort;

  return (
    <div className="flex min-h-[64px] w-full flex-col gap-3 rounded-[16px] bg-white px-4 py-3 lg:min-h-12 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:rounded-[12px] lg:border lg:border-border lg:py-2">
      <div ref={wrapperRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="true"
          className={cn(
            'inline-flex h-5 items-center gap-1 rounded-full border-0 bg-transparent p-0 text-[14px] font-normal leading-[140%] tracking-[-0.02em] lg:h-8 lg:gap-2 lg:text-sm lg:font-bold',
            isDefault ? 'text-ink-subtle' : 'text-ink',
          )}
        >
          <Filter className="h-4 w-4 shrink-0" />
          <span>Filter</span>
          {!isDefault && (
            <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-semibold text-white">
              •
            </span>
          )}
        </button>

        {open && (
          <div className="absolute left-0 top-9 z-30 w-[260px] rounded-2xl border border-border bg-white p-3 shadow-raised lg:top-10">
            <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
              Status
            </div>
            <div className="flex flex-col gap-1">
              {STATUS_OPTIONS.map((opt) => {
                const active = value.status === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onValueChange({ ...value, status: opt.value })}
                    className={cn(
                      'flex items-center justify-between rounded-lg px-2 py-1.5 text-left text-[13px] font-medium tracking-[-0.02em]',
                      active ? 'bg-surface-alt text-ink' : 'text-ink-muted hover:bg-surface-alt',
                    )}
                  >
                    <span>{opt.label}</span>
                    {active && <Check className="h-4 w-4 text-ink" />}
                  </button>
                );
              })}
            </div>

            {subjects.length > 0 && (
              <>
                <div className="mb-2 mt-3 px-1 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
                  Subject
                </div>
                <div className="flex max-h-36 flex-col gap-1 overflow-y-auto pr-1">
                  {[{ value: 'all', label: 'All subjects' }, ...subjects.map((subject) => ({ value: subject, label: subject }))].map((opt) => {
                    const active = value.subject === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onValueChange({ ...value, subject: opt.value })}
                        className={cn(
                          'flex items-center justify-between rounded-lg px-2 py-1.5 text-left text-[13px] font-medium',
                          active ? 'bg-surface-alt text-ink' : 'text-ink-muted hover:bg-surface-alt',
                        )}
                      >
                        <span className="truncate">{opt.label}</span>
                        {active && <Check className="h-4 w-4 shrink-0 text-ink" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {classes.length > 0 && (
              <>
                <div className="mb-2 mt-3 px-1 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
                  Class
                </div>
                <div className="flex flex-col gap-1">
                  {[{ value: 'all', label: 'All classes' }, ...classes.map((className) => ({ value: className, label: `Class ${className}` }))].map((opt) => {
                    const active = value.className === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onValueChange({ ...value, className: opt.value })}
                        className={cn(
                          'flex items-center justify-between rounded-lg px-2 py-1.5 text-left text-[13px] font-medium',
                          active ? 'bg-surface-alt text-ink' : 'text-ink-muted hover:bg-surface-alt',
                        )}
                      >
                        <span className="truncate">{opt.label}</span>
                        {active && <Check className="h-4 w-4 shrink-0 text-ink" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <div className="mb-2 mt-3 px-1 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
              Sort by
            </div>
            <div className="flex flex-col gap-1">
              {SORT_OPTIONS.map((opt) => {
                const active = value.sort === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onValueChange({ ...value, sort: opt.value })}
                    className={cn(
                      'flex items-center justify-between rounded-lg px-2 py-1.5 text-left text-[13px] font-medium tracking-[-0.02em]',
                      active ? 'bg-surface-alt text-ink' : 'text-ink-muted hover:bg-surface-alt',
                    )}
                  >
                    <span>{opt.label}</span>
                    {active && <Check className="h-4 w-4 text-ink" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2">
              <button
                type="button"
                onClick={() => onValueChange(DEFAULT_FILTER_VALUE)}
                disabled={isDefault}
                className="text-[12px] font-medium tracking-[-0.02em] text-ink-muted hover:text-ink disabled:opacity-40"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-ink px-3 py-1 text-[12px] font-semibold tracking-[-0.02em] text-white"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex h-11 w-full items-center rounded-full border border-border-strong px-4 py-[11px] lg:w-[300px] lg:border-border-strong">
        <Search className="h-4 w-4 shrink-0 text-ink-subtle" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search title, subject, class"
          className="h-5 min-w-0 flex-1 border-0 bg-transparent p-0 pl-3 text-[14px] font-normal leading-[140%] text-ink-subtle shadow-none placeholder:text-ink-subtle focus:border-0 focus:ring-0"
        />
      </div>
    </div>
  );
}
