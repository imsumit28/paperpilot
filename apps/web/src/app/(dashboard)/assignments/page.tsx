'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckSquare, LayoutGrid, List, Plus, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  SOCKET_EVENTS,
  type AssignmentDto,
  type JobCompletePayload,
  type JobFailedPayload,
} from '@paper-pilot/shared';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/assignments/EmptyState';
import { AssignmentCard } from '@/components/assignments/AssignmentCard';
import {
  DEFAULT_FILTER_VALUE,
  FilterBar,
  type FilterBarValue,
} from '@/components/assignments/FilterBar';
import { listAssignments, deleteAssignment, regenerateAssignment } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { subscribeToJob, unsubscribeFromJob } from '@/lib/jobSubscriptions';
import { useAssignmentCountStore } from '@/store/useAssignmentCountStore';
import { useGenerationStore } from '@/store/useGenerationStore';

export default function AssignmentsPage() {
  const router = useRouter();
  const setCount = useAssignmentCountStore((s) => s.setCount);
  const decrementCount = useAssignmentCountStore((s) => s.decrement);
  const [items, setItems] = useState<AssignmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterBarValue>(DEFAULT_FILTER_VALUE);
  const [error, setError] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const startGen = useGenerationStore((s) => s.start);

  async function refresh() {
    try {
      setLoading(true);
      const data = await listAssignments(1, 50);
      setItems(data.items);
      setCount(data.total ?? data.items.length);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  // Track subscriptions for in-progress items so we can update their status in-place
  // without polling. pendingIdsRef holds the set currently subscribed.
  const pendingIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const newPending = new Set(
      items.filter((a) => a.status === 'pending' || a.status === 'processing').map((a) => a.id),
    );
    for (const id of newPending) {
      if (!pendingIdsRef.current.has(id)) subscribeToJob(id);
    }
    for (const id of pendingIdsRef.current) {
      if (!newPending.has(id)) unsubscribeFromJob(id);
    }
    pendingIdsRef.current = newPending;
  }, [items]);

  useEffect(() => {
    const socket = getSocket();
    const onComplete = (p: JobCompletePayload) => {
      setItems((prev) =>
        prev.map((a) => (a.id === p.assignmentId ? { ...a, status: 'completed' as const } : a)),
      );
    };
    const onFailed = (p: JobFailedPayload) => {
      setItems((prev) =>
        prev.map((a) => (a.id === p.assignmentId ? { ...a, status: 'failed' as const } : a)),
      );
    };
    socket.on(SOCKET_EVENTS.JOB_COMPLETE, onComplete);
    socket.on(SOCKET_EVENTS.JOB_FAILED, onFailed);
    return () => {
      socket.off(SOCKET_EVENTS.JOB_COMPLETE, onComplete);
      socket.off(SOCKET_EVENTS.JOB_FAILED, onFailed);
      for (const id of pendingIdsRef.current) unsubscribeFromJob(id);
      pendingIdsRef.current = new Set();
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matchesStatus = (a: AssignmentDto) => {
      switch (filter.status) {
        case 'all':
          return true;
        case 'completed':
          return a.status === 'completed';
        case 'in-progress':
          return a.status === 'pending' || a.status === 'processing';
        case 'failed':
          return a.status === 'failed';
        default:
          return true;
      }
    };
    const result = items.filter(
      (a) => {
        const haystack = `${a.title} ${a.subject} ${a.class} ${a.school}`.toLowerCase();
        const matchesQuery = needle.length === 0 || haystack.includes(needle);
        const matchesSubject = filter.subject === 'all' || a.subject === filter.subject;
        const matchesClass = filter.className === 'all' || a.class === filter.className;
        return matchesQuery && matchesSubject && matchesClass && matchesStatus(a);
      },
    );
    const sorted = [...result];
    sorted.sort((a, b) => {
      switch (filter.sort) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'due-soonest':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
    return sorted;
  }, [items, query, filter]);

  const filterOptions = useMemo(() => {
    const subjects = Array.from(new Set(items.map((a) => a.subject).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b),
    );
    const classes = Array.from(new Set(items.map((a) => a.class).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
    return { subjects, classes };
  }, [items]);

  const metrics = useMemo(() => {
    const generating = items.filter((a) => a.status === 'pending' || a.status === 'processing').length;
    const ready = items.filter((a) => a.status === 'completed').length;
    const failed = items.filter((a) => a.status === 'failed').length;
    const pdfReady = items.filter((a) => a.pdfReady || a.paper).length;
    return { total: items.length, generating, ready, failed, pdfReady };
  }, [items]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this assignment?')) return;
    try {
      await deleteAssignment(id);
      setItems((prev) => prev.filter((a) => a.id !== id));
      decrementCount(1);
      toast.success('Assignment deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  async function handleRegenerate(id: string) {
    const current = items.find((a) => a.id === id);
    try {
      const res = await regenerateAssignment(id);
      startGen(res.id, res.jobId, current?.title);
      setItems((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: 'pending' as const,
                jobId: res.jobId,
                paper: undefined,
                pdfReady: false,
                updatedAt: new Date().toISOString(),
              }
            : a,
        ),
      );
      toast.success('Regeneration started');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to regenerate');
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} assignment${selectedIds.size === 1 ? '' : 's'}?`)) return;
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    const results = await Promise.allSettled(ids.map((id) => deleteAssignment(id)));
    const failed = results.filter((r) => r.status === 'rejected');
    const succeededIds = ids.filter((_, i) => results[i].status === 'fulfilled');
    setItems((prev) => prev.filter((a) => !succeededIds.includes(a.id)));
    if (succeededIds.length) decrementCount(succeededIds.length);
    exitSelectionMode();
    setBulkDeleting(false);
    if (failed.length === 0) {
      toast.success(`Deleted ${succeededIds.length} assignment${succeededIds.length === 1 ? '' : 's'}`);
    } else if (succeededIds.length === 0) {
      toast.error(`Failed to delete ${failed.length} assignment${failed.length === 1 ? '' : 's'}`);
    } else {
      toast.warning(`Deleted ${succeededIds.length}, failed ${failed.length}`);
    }
  }

  if (loading && items.length === 0) {
    return (
      <div className="px-4 lg:px-0 max-w-[400px] sm:max-w-[640px] md:max-w-[880px] lg:max-w-none mx-auto lg:mx-0">
        <Topbar title="Assignments" />
        <AssignmentsStrip onBack={() => router.back()} />
        <SkeletonGrid />
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="px-4 lg:px-0 max-w-[400px] sm:max-w-[640px] md:max-w-[880px] lg:max-w-none mx-auto lg:mx-0 flex flex-col h-full">
        <Topbar title="Assignments" />
        <AssignmentsStrip onBack={() => router.back()} />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <EmptyState />
        </div>
        <MobileFab />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-0 max-w-[400px] sm:max-w-[640px] md:max-w-[880px] lg:max-w-none mx-auto lg:mx-0">
      <Topbar title="Assignments" />
      <AssignmentsStrip onBack={() => router.back()} />

      <div className="hidden lg:flex items-end justify-between gap-4 mb-4 px-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
            Your assessments
          </p>
          <h1 className="mt-0.5 text-[26px] leading-tight font-bold text-ink">
            Assignments
          </h1>
          <p className="text-[14px] leading-[140%] text-ink-muted mt-1">
            Manage, generate, and grade papers for your classes.
          </p>
        </div>
        <Link href="/assignments/new">
          <Button iconLeft={<Plus className="h-4 w-4" />} className="h-11 px-5">
            Create Assignment
          </Button>
        </Link>
      </div>

      <div className="hidden lg:grid grid-cols-5 gap-3 mb-4 px-2">
        <SummaryMetric label="Total" value={metrics.total} />
        <SummaryMetric label="Ready" value={metrics.ready} tone="ready" />
        <SummaryMetric label="Generating" value={metrics.generating} tone="processing" />
        <SummaryMetric label="Failed" value={metrics.failed} tone="failed" />
        <SummaryMetric label="PDFs" value={metrics.pdfReady} />
      </div>

      {error && (
        <div className="mb-4 rounded-2xl bg-status-failed-bg border border-rose-200 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <SelectionBar
          selectionMode={selectionMode}
          selectedCount={selectedIds.size}
          totalVisible={filtered.length}
          allVisibleSelected={
            filtered.length > 0 && filtered.every((a) => selectedIds.has(a.id))
          }
          bulkDeleting={bulkDeleting}
          onEnter={() => setSelectionMode(true)}
          onCancel={exitSelectionMode}
          onToggleAll={() => {
            const allSelected = filtered.every((a) => selectedIds.has(a.id));
            setSelectedIds(allSelected ? new Set() : new Set(filtered.map((a) => a.id)));
          }}
          onDelete={handleBulkDelete}
        />

        <FilterBar
          query={query}
          onQueryChange={setQuery}
          value={filter}
          onValueChange={setFilter}
          subjects={filterOptions.subjects}
          classes={filterOptions.classes}
        />

        <div className="flex items-center justify-between gap-3 px-1">
          <p className="text-[13px] font-medium text-ink-muted">
            Showing <span className="font-semibold text-ink">{filtered.length}</span> of{' '}
            <span className="font-semibold text-ink">{items.length}</span>
          </p>
          <div className="hidden items-center rounded-full border border-border bg-white p-1 md:flex">
            <button
              type="button"
              title="Grid view"
              onClick={() => setViewMode('grid')}
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                viewMode === 'grid' ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:bg-surface-alt'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="List view"
              onClick={() => setViewMode('list')}
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                viewMode === 'list' ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:bg-surface-alt'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-ink-muted">No assignments match your search.</div>
        ) : (
          <div
            className={
              viewMode === 'list'
                ? 'grid grid-cols-1 gap-3 pb-24 lg:pb-16'
                : 'grid grid-cols-1 md:grid-cols-2 gap-3 pb-24 lg:pb-16'
            }
          >
            {filtered.map((a) => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                onDelete={handleDelete}
                onRegenerate={handleRegenerate}
                selectable={selectionMode}
                selected={selectedIds.has(a.id)}
                onToggleSelect={toggleSelect}
                layout={viewMode}
              />
            ))}
          </div>
        )}
      </div>

      <BottomBlurFade />
      <MobileFab />
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'ready' | 'processing' | 'failed';
}) {
  const toneClass =
    tone === 'ready'
      ? 'text-status-ready'
      : tone === 'processing'
        ? 'text-status-processing'
        : tone === 'failed'
          ? 'text-status-failed'
          : 'text-ink';

  return (
    <div className="rounded-2xl border border-border bg-white px-4 py-3 shadow-card">
      <div className="text-[12px] font-medium text-ink-subtle">{label}</div>
      <div className={`mt-1 text-[22px] font-bold leading-none ${toneClass}`}>{value}</div>
    </div>
  );
}

interface SelectionBarProps {
  selectionMode: boolean;
  selectedCount: number;
  totalVisible: number;
  allVisibleSelected: boolean;
  bulkDeleting: boolean;
  onEnter: () => void;
  onCancel: () => void;
  onToggleAll: () => void;
  onDelete: () => void;
}

function SelectionBar({
  selectionMode,
  selectedCount,
  totalVisible,
  allVisibleSelected,
  bulkDeleting,
  onEnter,
  onCancel,
  onToggleAll,
  onDelete,
}: SelectionBarProps) {
  if (!selectionMode) {
    return (
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onEnter}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white border border-border text-[13px] font-semibold tracking-[-0.02em] text-ink hover:bg-surface-alt"
        >
          <CheckSquare className="h-3.5 w-3.5" />
          Select
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl bg-white border border-border px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onCancel}
          className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-surface-alt"
          aria-label="Cancel selection"
        >
          <X className="h-4 w-4 text-ink" />
        </button>
        <span className="text-[13px] font-semibold tracking-[-0.02em] text-ink">
          {selectedCount} selected
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleAll}
          disabled={totalVisible === 0}
          className="h-8 px-3 rounded-full border border-border text-[13px] font-semibold tracking-[-0.02em] text-ink hover:bg-surface-alt disabled:opacity-40 disabled:hover:bg-transparent"
        >
          {allVisibleSelected ? 'Deselect all' : 'Select all'}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={selectedCount === 0 || bulkDeleting}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-status-failed text-white text-[13px] font-semibold tracking-[-0.02em] hover:bg-rose-700 disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {bulkDeleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

function BottomBlurFade() {
  return (
    <div
      aria-hidden
      className="bottom-blur-fade lg:hidden pointer-events-none fixed inset-x-0 bottom-0 z-10 h-32"
    />
  );
}

function MobileFab() {
  return (
    <Link
      href="/assignments/new"
      className="lg:hidden fixed bottom-24 right-4 z-20 h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center text-accent-500"
      aria-label="Create Assignment"
    >
      <Plus className="h-5 w-5" />
    </Link>
  );
}

function MobileAssignmentsHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="lg:hidden pt-2 pb-5">
      <div className="relative flex items-center justify-center h-12 rounded-[18px] bg-[rgba(0,0,0,0.12)]">
        <button
          type="button"
          onClick={onBack}
          className="absolute left-0 h-12 w-12 rounded-full bg-[rgba(255,255,255,0.25)] backdrop-blur-[12px] flex items-center justify-center"
          aria-label="Back"
        >
          <ArrowLeft className="h-6 w-6 text-ink" strokeWidth={2.25} />
        </button>
        <h1 className="text-[16px] font-bold leading-[140%] tracking-[-0.02em] text-ink">Assignments</h1>
      </div>
    </div>
  );
}

function AssignmentsStrip({ onBack }: { onBack: () => void }) {
  return (
    <div className="lg:hidden">
      <MobileAssignmentsHeader onBack={onBack} />
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-border p-5 h-32 animate-pulse">
          <div className="h-4 w-2/3 bg-surface-alt rounded mb-3" />
          <div className="h-3 w-1/3 bg-surface-alt rounded mb-6" />
          <div className="flex justify-between">
            <div className="h-3 w-24 bg-surface-alt rounded" />
            <div className="h-3 w-24 bg-surface-alt rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
