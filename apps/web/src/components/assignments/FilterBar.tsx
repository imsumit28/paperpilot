'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

export type AssignmentStatusFilter = 'all' | 'completed' | 'in-progress' | 'failed';
export type AssignmentSortOption = 'newest' | 'oldest' | 'due-soonest' | 'title-asc';

export interface FilterBarValue {
  status: AssignmentStatusFilter;
  sort: AssignmentSortOption;
}

interface Props {
  query: string;
  onQueryChange: (v: string) => void;
  value: FilterBarValue;
  onValueChange: (v: FilterBarValue) => void;
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
  { value: 'title-asc', label: 'Title (A–Z)' },
];

export const DEFAULT_FILTER_VALUE: FilterBarValue = { status: 'all', sort: 'newest' };

export function FilterBar({ query, onQueryChange, value, onValueChange }: Props) {
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
    value.status === DEFAULT_FILTER_VALUE.status && value.sort === DEFAULT_FILTER_VALUE.sort;

  return (
    <div className="flex h-[64px] w-full items-center justify-between gap-[36px] rounded-[16px] bg-white px-4 lg:h-12 lg:px-4 lg:bg-white lg:rounded-[12px] lg:border lg:border-border">
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
          <div className="absolute left-0 top-9 z-30 w-[240px] rounded-2xl border border-border bg-white p-3 shadow-raised lg:top-10">
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

      <div className="flex h-11 w-[228px] items-center rounded-full border border-border-strong px-4 py-[11px] lg:w-[265px] lg:border-border-strong">
        <Search className="h-4 w-4 shrink-0 text-ink-subtle" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search Name"
          className="h-5 min-w-0 flex-1 border-0 bg-transparent p-0 pl-3 text-[14px] font-normal leading-[140%] tracking-[-0.02em] text-ink-subtle shadow-none placeholder:text-ink-subtle focus:border-0 focus:ring-0"
        />
      </div>
    </div>
  );
}
