'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckSquare,
  ClipboardList,
  FileText,
  LayoutList,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import type { AssignmentDto } from '@paper-pilot/shared';
import { Topbar } from '@/components/layout/Topbar';
import { StatusBadge } from '@/components/ui/Badge';
import { listAssignments } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useSavedPapersStore } from '@/store/useSavedPapersStore';
import { formatDate } from '@/lib/utils';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const TOOLS = [
  { href: '/toolkit/lesson-plan', label: 'Lesson Planner', desc: 'Plan any topic', Icon: BookOpen },
  { href: '/toolkit/rubric', label: 'Rubric Builder', desc: 'Marking criteria', Icon: LayoutList },
  { href: '/toolkit/grading', label: 'Grading Assistant', desc: 'Instant feedback', Icon: CheckSquare },
];

export default function HomePage() {
  const teacherName = useAuthStore((s) => s.teacherName);
  const schoolName = useAuthStore((s) => s.schoolName);
  const savedCount = useSavedPapersStore((s) => s.savedPapers.length);

  const [items, setItems] = useState<AssignmentDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await listAssignments(1, 20);
        if (!alive) return;
        setItems(data.items);
        setTotal(data.total ?? data.items.length);
      } catch {
        /* keep empty on failure */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const stats = useMemo(() => {
    const ready = items.filter((a) => a.status === 'completed').length;
    const working = items.filter((a) => a.status === 'pending' || a.status === 'processing').length;
    return { ready, working };
  }, [items]);

  const recent = useMemo(
    () =>
      [...items]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4),
    [items],
  );

  const firstName = (teacherName || '').trim().split(/\s+/)[0] || 'there';

  return (
    <div className="px-4 lg:px-0 pb-24 lg:pb-12">
      <Topbar title="Home" showBack={false} />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500 px-6 py-7 text-white lg:px-9 lg:py-9">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 h-56 w-56 rounded-full bg-accent-400/20 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-white/70">
              {greeting()}
            </p>
            <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-[-0.02em] lg:text-[36px]">
              Welcome back, {firstName} 👋
            </h1>
            <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-white/80 lg:text-[15px]">
              {schoolName ? `${schoolName} · ` : ''}
              {total > 0
                ? `${total} assignment${total === 1 ? '' : 's'}${stats.working ? ` · ${stats.working} generating` : ''}.`
                : 'Generate your first AI question paper in under a minute.'}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              href="/assignments/new"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-brand-700 shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.99]"
            >
              <Sparkles className="h-[18px] w-[18px] text-accent-500" />
              Create assignment
            </Link>
            <Link
              href="/assignments"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 text-[15px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              View all
              <ArrowRight className="h-[18px] w-[18px]" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total assignments" value={total} dot="bg-ink" loading={loading} />
        <StatCard label="Ready" value={stats.ready} dot="bg-status-ready" loading={loading} />
        <StatCard label="Generating" value={stats.working} dot="bg-status-processing" loading={loading} />
        <StatCard label="Saved papers" value={savedCount} dot="bg-accent-500" loading={false} />
      </div>

      {/* Two-column: recent + tools */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Recent */}
        <section>
          <SectionHeader
            eyebrow="Pick up where you left off"
            title="Recent assignments"
            href="/assignments"
            cta="See all"
          />
          <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface">
            {loading ? (
              <RecentSkeleton />
            ) : recent.length === 0 ? (
              <EmptyRecent />
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/assignments/${a.id}`}
                      className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-alt lg:px-5"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <ClipboardList className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-semibold text-ink tracking-[-0.01em]">
                          {a.title}
                        </div>
                        <div className="mt-0.5 truncate text-[13px] text-ink-muted">
                          {[a.subject, a.class && `Class ${a.class}`].filter(Boolean).join(' · ') ||
                            `Created ${formatDate(a.createdAt)}`}
                        </div>
                      </div>
                      <div className="hidden shrink-0 text-right text-[12px] text-ink-subtle sm:block">
                        Due {formatDate(a.dueDate)}
                      </div>
                      <StatusBadge status={a.status} />
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-subtle transition-colors group-hover:text-brand-600" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Tools + quick links */}
        <section>
          <SectionHeader eyebrow="AI Teacher's Toolkit" title="Tools" href="/toolkit" cta="Open" />
          <div className="mt-3 flex flex-col gap-3">
            {TOOLS.map(({ href, label, desc, Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 transition-all hover:border-brand-300 hover:shadow-raised"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-ink tracking-[-0.01em]">{label}</div>
                  <div className="text-[12px] text-ink-muted">{desc}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
              </Link>
            ))}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <QuickLink href="/library" label="My Library" Icon={FileText} />
              <QuickLink href="/groups" label="My Groups" Icon={Users} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  dot,
  loading,
}: {
  label: string;
  value: number;
  dot: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-4">
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <span className="text-[12px] font-medium text-ink-muted">{label}</span>
      </div>
      {loading ? (
        <div className="mt-2 h-8 w-12 animate-pulse rounded-md bg-surface-alt" />
      ) : (
        <div className="mt-1 text-[30px] font-bold leading-none tracking-[-0.02em] text-ink tabular-nums">
          {value}
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  href,
  cta,
}: {
  eyebrow: string;
  title: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
          {eyebrow}
        </p>
        <h2 className="mt-0.5 text-[20px] font-bold tracking-[-0.02em] text-ink">{title}</h2>
      </div>
      <Link
        href={href}
        className="shrink-0 text-[13px] font-semibold text-brand-700 hover:text-brand-800"
      >
        {cta}
      </Link>
    </div>
  );
}

function QuickLink({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3.5 py-3 text-[13px] font-semibold text-ink transition-colors hover:bg-surface-alt"
    >
      <Icon className="h-4 w-4 text-ink-muted" />
      {label}
    </Link>
  );
}

function EmptyRecent() {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <ClipboardList className="h-6 w-6" />
      </span>
      <div>
        <div className="text-[15px] font-semibold text-ink">No assignments yet</div>
        <p className="mt-0.5 text-[13px] text-ink-muted">Your generated papers will show up here.</p>
      </div>
      <Link
        href="/assignments/new"
        className="mt-1 inline-flex h-10 items-center gap-2 rounded-full bg-brand-600 px-5 text-[14px] font-semibold text-white hover:bg-brand-700"
      >
        <Plus className="h-4 w-4" />
        Create your first
      </Link>
    </div>
  );
}

function RecentSkeleton() {
  return (
    <ul className="divide-y divide-border">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 px-4 py-3.5 lg:px-5">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-surface-alt" />
          <div className="min-w-0 flex-1">
            <div className="h-4 w-2/3 animate-pulse rounded bg-surface-alt" />
            <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-surface-alt" />
          </div>
          <div className="h-5 w-16 animate-pulse rounded-full bg-surface-alt" />
        </li>
      ))}
    </ul>
  );
}
