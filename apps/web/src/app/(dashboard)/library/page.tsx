'use client';

import Link from 'next/link';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { useSavedPapersStore } from '@/store/useSavedPapersStore';
import { formatDate } from '@/lib/utils';

export default function LibraryPage() {
  const { savedPapers, unsavePaper } = useSavedPapersStore();

  return (
    <div className="px-4 lg:px-0 pb-24 lg:pb-12">
      <Topbar title="My Library" />
      <div className="mb-5 px-1 lg:px-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
          Saved for later
        </p>
        <h1 className="mt-0.5 text-[28px] leading-tight tracking-[-0.02em] font-bold text-ink">
          My Library
        </h1>
        <p className="mt-1 text-[14px] tracking-[-0.01em] text-ink-muted">
          {savedPapers.length > 0
            ? `${savedPapers.length} saved paper${savedPapers.length === 1 ? '' : 's'}.`
            : 'Bookmark papers from any assignment to keep them here.'}
        </p>
      </div>
      {savedPapers.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Bookmark className="h-8 w-8 mx-auto mb-3 text-ink-muted opacity-40" />
            <div className="text-lg font-semibold text-ink mb-1">No saved papers yet</div>
            <div className="text-sm text-ink-muted">
              Tap the <span className="font-semibold">⋮</span> menu on any assignment and choose{' '}
              <span className="font-semibold">Save Paper</span> to add it here.
            </div>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {savedPapers.map((assignment) => (
            <Card
              key={assignment.id}
              className="relative w-full rounded-[24px] p-5 lg:p-6 bg-white"
            >
              <div className="flex items-start justify-between gap-4">
                <Link href={`/assignments/${assignment.id}`} className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-[18px] lg:text-[24px] leading-[140%] lg:leading-[120%] tracking-[-0.02em] text-ink line-clamp-1">
                    {assignment.title}
                  </h3>
                  <div className="flex gap-4 mt-2 text-[14px] font-medium text-ink-subtle">
                    <span>Assigned: {formatDate(assignment.createdAt)}</span>
                    <span>Due: {formatDate(assignment.dueDate)}</span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => unsavePaper(assignment.id)}
                  className="shrink-0 h-8 w-8 flex items-center justify-center rounded-full hover:bg-surface-alt"
                  aria-label="Remove from library"
                >
                  <BookmarkCheck className="h-4 w-4 text-brand" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
