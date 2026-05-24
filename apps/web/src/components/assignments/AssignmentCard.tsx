'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, MoreVertical, Bookmark, BookmarkCheck } from 'lucide-react';
import type { AssignmentDto } from '@paper-pilot/shared';
import { Card } from '@/components/ui/Card';
import { cn, formatDate } from '@/lib/utils';
import { useSavedPapersStore } from '@/store/useSavedPapersStore';

interface Props {
  assignment: AssignmentDto;
  onDelete: (id: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const STATUS_LABELS: Record<AssignmentDto['status'], { color: string; label: string }> = {
  pending: { color: 'bg-amber-500', label: 'Queued' },
  processing: { color: 'bg-blue-500 animate-pulse', label: 'Generating...' },
  completed: { color: 'bg-emerald-500', label: 'Ready' },
  failed: { color: 'bg-red-500', label: 'Failed' },
};

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
  const status = STATUS_LABELS[assignment.status];

  return (
    <Card
      onClick={selectable ? () => onToggleSelect?.(assignment.id) : undefined}
      className={cn(
        'relative group w-full h-[116px] lg:h-[162px] rounded-[24px] border-0 shadow-none p-5 lg:p-6 bg-[rgba(255,255,255,0.75)] lg:bg-white backdrop-blur-[12px]',
        menuOpen && 'z-30',
        selectable && 'cursor-pointer',
        selected && 'ring-2 ring-[#FF5623] ring-offset-2 ring-offset-[#EDEDED]',
      )}
    >
      {selectable && (
        <div
          aria-hidden
          className={cn(
            'absolute top-3 left-3 z-10 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors',
            selected
              ? 'bg-[#FF5623] border-[#FF5623] text-white'
              : 'bg-white/80 border-[#A9A9A9]',
          )}
        >
          {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </div>
      )}
      <div className="flex h-[76px] flex-col justify-between">
        <div className="flex items-start justify-between gap-[39px] h-[25px]">
          {selectable ? (
            <h3 className={cn(
              'font-extrabold text-[18px] lg:text-[24px] leading-[140%] lg:leading-[120%] tracking-[-0.04em] text-[#303030] line-clamp-1 min-w-0',
              'pl-7',
            )}>
              {assignment.title}
            </h3>
          ) : (
            <Link href={`/assignments/${assignment.id}`} className="min-w-0">
              <h3 className="font-extrabold text-[18px] lg:text-[24px] leading-[140%] lg:leading-[120%] tracking-[-0.04em] text-[#303030] line-clamp-1">
                {assignment.title}
              </h3>
            </Link>
          )}
          <div className={cn('relative shrink-0', selectable && 'hidden')}>
            <button
              onClick={() => setMenuOpen((s) => !s)}
              className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-surface-alt"
              aria-label="More options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-20 w-[160px] bg-white rounded-2xl shadow-[0px_16px_48px_rgba(0,0,0,0.2),0px_32px_48px_rgba(0,0,0,0.05)] overflow-visible p-2 flex flex-col gap-1">
                  <Link
                    href={`/assignments/${assignment.id}`}
                    className="block h-8 px-2 py-1.5 text-[14px] font-medium leading-[140%] tracking-[-0.04em] text-[#303030] rounded-lg hover:bg-surface-alt"
                    onClick={() => setMenuOpen(false)}
                  >
                    View Assignment
                  </Link>
                  <div className="relative">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 w-full h-8 text-left px-2 py-1.5 text-[14px] font-medium leading-[140%] tracking-[-0.04em] text-[#303030] rounded-lg hover:bg-surface-alt"
                      onClick={() => {
                        saved ? unsavePaper(assignment.id) : savePaper(assignment);
                        setMenuOpen(false);
                      }}
                      onMouseEnter={() => setSaveTooltip(true)}
                      onMouseLeave={() => setSaveTooltip(false)}
                    >
                      {saved ? (
                        <BookmarkCheck className="h-3.5 w-3.5 text-brand shrink-0" />
                      ) : (
                        <Bookmark className="h-3.5 w-3.5 shrink-0" />
                      )}
                      {saved ? 'Unsave Paper' : 'Save Paper'}
                    </button>
                    {saveTooltip && (
                      <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 z-30 w-[180px] bg-[#303030] text-white text-[11px] font-medium leading-[140%] rounded-xl px-3 py-2 shadow-lg pointer-events-none whitespace-normal">
                        Saved papers appear in{' '}
                        <span className="font-bold">Home › My Library</span>
                      </div>
                    )}
                  </div>
                  <button
                    className="block w-full h-8 text-left px-2 py-1.5 text-[14px] font-medium leading-[140%] tracking-[-0.04em] text-[#C53535] rounded-lg bg-[#F6F6F6] hover:bg-red-50"
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
        <div className="flex h-[19px] items-center justify-between gap-4 lg:gap-6 text-[16px] lg:text-[16px] font-extrabold leading-[120%] tracking-[-0.04em] text-[#303030]">
          <div className="min-w-0">
            <span className="font-extrabold">Assigned on </span>
            <span className="text-[#8A8A8A]">: {formatDate(assignment.createdAt)}</span>
          </div>
          <div className="min-w-0">
            <span className="font-extrabold">Due </span>
            <span className="text-[#8A8A8A]">: {formatDate(assignment.dueDate)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
