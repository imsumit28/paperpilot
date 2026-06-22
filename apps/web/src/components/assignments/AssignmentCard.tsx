'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Check,
  Copy,
  Download,
  Eye,
  MoreVertical,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import type { AssignmentDto } from '@paper-pilot/shared';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { cn, formatDate } from '@/lib/utils';
import { pdfDownloadUrl } from '@/lib/api';
import { useSavedPapersStore } from '@/store/useSavedPapersStore';

interface Props {
  assignment: AssignmentDto;
  onDelete: (id: string) => void;
  onRegenerate?: (id: string) => void;
  onDuplicate?: (assignment: AssignmentDto) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  layout?: 'grid' | 'list';
}

export function AssignmentCard({
  assignment,
  onDelete,
  onRegenerate,
  onDuplicate,
  selectable = false,
  selected = false,
  onToggleSelect,
  layout = 'grid',
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [saveTooltip, setSaveTooltip] = useState(false);
  const { savePaper, unsavePaper, isSaved } = useSavedPapersStore();
  const saved = isSaved(assignment.id);

  const meta = [assignment.subject, assignment.class && `Class ${assignment.class}`]
    .filter(Boolean)
    .join(' - ');
  const displayTitle = formatTitle(assignment.title);
  const totalQuestions = assignment.questionTypes.reduce((sum, row) => sum + row.count, 0);
  const estimatedMarks =
    assignment.paper?.maximumMarks ??
    assignment.questionTypes.reduce((sum, row) => sum + row.count * row.marks, 0);
  const duration = assignment.paper?.timeAllowed ?? estimateDuration(estimatedMarks);
  const pdfAvailable = assignment.pdfReady || Boolean(assignment.paper);
  const updatedLabel = relativeDate(assignment.updatedAt);
  const dueLabel = relativeDueDate(assignment.dueDate);

  function handleDownload() {
    if (!pdfAvailable) return;
    window.open(pdfDownloadUrl(assignment.id), '_blank', 'noopener,noreferrer');
  }

  return (
    <Card
      onClick={selectable ? () => onToggleSelect?.(assignment.id) : undefined}
      className={cn(
        'relative group flex w-full flex-col gap-4 rounded-2xl bg-surface p-5 transition-all duration-200',
        layout === 'list' && 'lg:grid lg:grid-cols-[1.25fr_1fr_auto] lg:items-center lg:gap-5',
        !selectable && 'cursor-pointer hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-raised',
        menuOpen && 'z-40',
        selectable && 'cursor-pointer',
        selected && 'ring-2 ring-brand-500 ring-offset-2 ring-offset-surface-page',
      )}
    >
      <div className={cn('flex items-center justify-between gap-3', layout === 'list' && 'lg:contents')}>
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
          <div className={cn(layout === 'list' && 'lg:order-2')}>
            <StatusBadge status={assignment.status} />
          </div>
        )}

        <div className={cn('relative shrink-0', selectable && 'hidden')}>
          <button
            type="button"
            onClick={() => setMenuOpen((s) => !s)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt"
            aria-label="More options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 flex w-[180px] flex-col gap-1 overflow-visible rounded-2xl bg-white p-2 shadow-raised">
                <MenuLink href={`/assignments/${assignment.id}`} onClick={() => setMenuOpen(false)}>
                  <Eye className="h-3.5 w-3.5 shrink-0" />
                  View
                </MenuLink>
                <MenuButton
                  disabled={!pdfAvailable}
                  onClick={() => {
                    setMenuOpen(false);
                    handleDownload();
                  }}
                >
                  <Download className="h-3.5 w-3.5 shrink-0" />
                  Download PDF
                </MenuButton>
                {onRegenerate && (
                  <MenuButton
                    onClick={() => {
                      setMenuOpen(false);
                      onRegenerate(assignment.id);
                    }}
                  >
                    <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                    Regenerate
                  </MenuButton>
                )}
                {onDuplicate && (
                  <MenuButton
                    onClick={() => {
                      setMenuOpen(false);
                      onDuplicate(assignment);
                    }}
                  >
                    <Copy className="h-3.5 w-3.5 shrink-0" />
                    Duplicate
                  </MenuButton>
                )}
                <div className="relative">
                  <MenuButton
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
                    {saved ? 'Unsave' : 'Save'}
                  </MenuButton>
                  {saveTooltip && (
                    <div className="pointer-events-none absolute right-full top-1/2 z-30 mr-2 w-[180px] -translate-y-1/2 whitespace-normal rounded-xl bg-ink px-3 py-2 text-[11px] font-medium leading-[140%] text-white shadow-lg">
                      Saved papers appear in <span className="font-bold">My Library</span>
                    </div>
                  )}
                </div>
                <MenuButton
                  danger
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(assignment.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 shrink-0" />
                  Delete
                </MenuButton>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        {selectable ? (
          <h3 className="line-clamp-2 text-[18px] font-bold leading-[125%] text-ink lg:text-[22px]">
            {displayTitle}
          </h3>
        ) : (
          <Link href={`/assignments/${assignment.id}`} className="block min-w-0">
            <h3 className="line-clamp-2 text-[18px] font-bold leading-[125%] text-ink transition-colors group-hover:text-brand-700 lg:text-[22px]">
              {displayTitle}
            </h3>
          </Link>
        )}
        {meta && <p className="mt-1 truncate text-[13px] font-medium text-ink-muted">{meta}</p>}
      </div>

      <div className={cn('grid grid-cols-2 gap-2 text-[12px]', layout === 'list' && 'lg:grid-cols-4')}>
        <Metric label="Marks" value={`${estimatedMarks}`} />
        <Metric label="Questions" value={`${totalQuestions}`} />
        <Metric label="Duration" value={duration} />
        <Metric label="PDF" value={pdfAvailable ? 'Available' : 'Pending'} />
      </div>

      <div
        className={cn(
          'flex items-center justify-between gap-3 border-t border-border pt-3 text-[12px] font-medium text-ink-subtle',
          layout === 'list' && 'lg:border-t-0 lg:pt-0',
        )}
      >
        <span title={formatDate(assignment.updatedAt, 'long')}>
          Updated <span className="text-ink-muted">{updatedLabel}</span>
        </span>
        <span title={formatDate(assignment.dueDate, 'long')}>
          Due <span className="text-ink-muted">{dueLabel}</span>
        </span>
      </div>

      {!selectable && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100">
          <QuickAction href={`/assignments/${assignment.id}`} label="View" icon={<Eye className="h-3.5 w-3.5" />} />
          <QuickAction
            label="Download"
            icon={<Download className="h-3.5 w-3.5" />}
            disabled={!pdfAvailable}
            onClick={handleDownload}
          />
          {onRegenerate && (
            <QuickAction
              label="Regenerate"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={() => onRegenerate(assignment.id)}
            />
          )}
          {onDuplicate && (
            <QuickAction
              label="Duplicate"
              icon={<Copy className="h-3.5 w-3.5" />}
              onClick={() => onDuplicate(assignment)}
            />
          )}
          <button
            type="button"
            title={saved ? 'Remove from library' : 'Save to library'}
            onClick={() => (saved ? unsavePaper(assignment.id) : savePaper(assignment))}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt hover:text-brand-700"
          >
            {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </button>
          <button
            type="button"
            title="Delete assignment"
            onClick={() => onDelete(assignment.id)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-status-failed-bg hover:text-status-failed"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-surface-alt px-3 py-2">
      <div className="text-[11px] font-medium text-ink-subtle">{label}</div>
      <div className="truncate text-[13px] font-semibold text-ink">{value}</div>
    </div>
  );
}

function QuickAction({
  href,
  label,
  icon,
  disabled,
  onClick,
}: {
  href?: string;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  // Icon-only on small screens (where a phone-width card can't fit the labels),
  // expanding to icon + label from `sm` up where there's room.
  const className =
    'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-border px-2 sm:px-3 text-[12px] font-semibold text-ink-muted transition-colors hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40';
  const text = <span className="hidden sm:inline">{label}</span>;

  if (href) {
    return (
      <Link href={href} title={label} aria-label={label} className={className}>
        {icon}
        {text}
      </Link>
    );
  }

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={className}
    >
      {icon}
      {text}
    </button>
  );
}

function MenuLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex h-8 items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[14px] font-medium leading-[140%] text-ink hover:bg-surface-alt"
    >
      {children}
    </Link>
  );
}

function MenuButton({
  children,
  danger,
  disabled,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  children: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        'flex h-8 w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[14px] font-medium leading-[140%] hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-40',
        danger ? 'text-status-failed hover:bg-status-failed-bg' : 'text-ink',
      )}
    >
      {children}
    </button>
  );
}

function formatTitle(title: string) {
  return title
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 2 && word === word.toUpperCase()) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function estimateDuration(totalMarks: number) {
  if (totalMarks >= 80) return '3 hrs';
  if (totalMarks >= 50) return '2 hrs';
  if (totalMarks >= 25) return '1 hr';
  return '30 min';
}

function relativeDate(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return formatDate(input);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days <= 7) return `${days}d ago`;
  return formatDate(input);
}

function relativeDueDate(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return formatDate(input);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const days = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days <= 7) return `in ${days}d`;
  return formatDate(input);
}
