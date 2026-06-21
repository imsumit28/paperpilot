'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, MoreVertical, Bookmark, BookmarkCheck } from 'lucide-react';
import type { AssignmentDto } from '@paper-pilot/shared';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { cn, formatDate } from '@/lib/utils';
import { useSavedPapersStore } from '@/store/useSavedPapersStore';

interface Props {
  assignment: AssignmentDto;
  onDelete: (id: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function AssignmentCard({
  assignment,
  onDelete,
  selectable = false,
  selected = false,
  onToggleSelect,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [saveTooltip, setSaveTooltip] = useState(false);
  const { savePaper, unsavePaper, isSaved } = useSavedPapersStore();
  const saved = isSaved(assignment.id);

  const meta = [assignment.subject, assignment.class && `Class ${assignment.class}`]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card
      onClick={selectable ? () => onToggleSelect?.(assignment.id) : undefined}
      className={cn(
        'relative group flex w-full flex-col gap-4 rounded-2xl bg-surface p-5 transition-all',
        !selectable && 'hover:border-brand-300 hover:shadow-raised',
        menuOpen && 'z-40',
        selectable && 'cursor-pointer',
        selected && 'ring-2 ring-brand-500 ring-offset-2 ring-offset-surface-page',
      )}
    >
      {/* Top row: selection / status + menu */}
      <div className="flex items-center justify-between gap-3">
        {selectable ? (
          <span
            aria-hidden
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors',
              selected ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-ink-subtle',
            )}
          >
            {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
          </span>
        ) : (
          <StatusBadge status={assignment.status} />
        )}

        <div className={cn('relative shrink-0', selectable && 'hidden')}>
          <button
            onClick={() => setMenuOpen((s) => !s)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt"
            aria-label="More options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 flex w-[160px] flex-col gap-1 overflow-visible rounded-2xl bg-white p-2 shadow-raised">
                <Link
                  href={`/assignments/${assignment.id}`}
                  className="block h-8 rounded-lg px-2 py-1.5 text-[14px] font-medium leading-[140%] tracking-[-0.02em] text-ink hover:bg-surface-alt"
                  onClick={() => setMenuOpen(false)}
                >
                  View Assignment
                </Link>
                <div className="relative">
                  <button
                    type="button"
                    className="flex h-8 w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[14px] font-medium leading-[140%] tracking-[-0.02em] text-ink hover:bg-surface-alt"
                    onClick={() => {
                      saved ? unsavePaper(assignment.id) : savePaper(assignment);
                      setMenuOpen(false);
                    }}
                    onMouseEnter={() => setSaveTooltip(true)}
                    onMouseLeave={() => setSaveTooltip(false)}
                  >
                    {saved ? (
                      <BookmarkCheck className="h-3.5 w-3.5 shrink-0 text-brand" />
                    ) : (
                      <Bookmark className="h-3.5 w-3.5 shrink-0" />
                    )}
                    {saved ? 'Unsave Paper' : 'Save Paper'}
                  </button>
                  {saveTooltip && (
                    <div className="pointer-events-none absolute right-full top-1/2 z-30 mr-2 w-[180px] -translate-y-1/2 whitespace-normal rounded-xl bg-ink px-3 py-2 text-[11px] font-medium leading-[140%] text-white shadow-lg">
                      Saved papers appear in <span className="font-bold">Home › My Library</span>
                    </div>
                  )}
                </div>
                <button
                  className="block h-8 w-full rounded-lg bg-surface-alt px-2 py-1.5 text-left text-[14px] font-medium leading-[140%] tracking-[-0.02em] text-status-failed hover:bg-rose-50"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(assignment.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        {selectable ? (
          <h3 className="line-clamp-2 text-[18px] font-bold leading-[125%] tracking-[-0.02em] text-ink lg:text-[22px]">
            {assignment.title}
          </h3>
        ) : (
          <Link href={`/assignments/${assignment.id}`} className="block min-w-0">
            <h3 className="line-clamp-2 text-[18px] font-bold leading-[125%] tracking-[-0.02em] text-ink transition-colors group-hover:text-brand-700 lg:text-[22px]">
              {assignment.title}
            </h3>
          </Link>
        )}
        {meta && <p className="mt-1 truncate text-[13px] font-medium text-ink-muted">{meta}</p>}
      </div>

      {/* Footer dates */}
      <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-[12px] font-medium text-ink-subtle">
        <span>
          Assigned <span className="text-ink-muted">{formatDate(assignment.createdAt)}</span>
        </span>
        <span>
          Due <span className="text-ink-muted">{formatDate(assignment.dueDate)}</span>
        </span>
      </div>
    </Card>
  );
}
