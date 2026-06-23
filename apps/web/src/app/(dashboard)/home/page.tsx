'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ClipboardList,
  Landmark,
  Minus,
  Moon,
  Plus,
  ShieldCheck,
  Sparkle,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Wand2,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AssignmentDto } from '@paper-pilot/shared';
import { Topbar } from '@/components/layout/Topbar';
import { StatusBadge } from '@/components/ui/Badge';
import { listAssignments } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useSavedPapersStore } from '@/store/useSavedPapersStore';
import { formatDate } from '@/lib/utils';

function greeting(d: Date): string {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

// Warm time-of-day glyph for the hero eyebrow (sunrise → sun → sunset → moon).
function TimeIcon({ date, className }: { date: Date; className?: string }) {
  const h = date.getHours();
  if (h < 12) return <Sunrise className={className} />;
  if (h < 17) return <Sun className={className} />;
  if (h < 21) return <Sunset className={className} />;
  return <Moon className={className} />;
}

const HERO_FEATURES = [
  { Icon: Wand2, title: 'AI-Powered', desc: 'Smarter question generation' },
  { Icon: BookOpen, title: 'Curriculum Aligned', desc: 'Based on your class and subject' },
  { Icon: Zap, title: 'Instant Results', desc: 'Structured papers in seconds' },
  { Icon: ShieldCheck, title: 'Secure & Reliable', desc: 'Your data is safe and private' },
];

// Decorative question-type chips for the hero scene (illustrative, aria-hidden).
const HERO_PILLS = [
  { label: 'MCQs', count: 12, pos: 'left-[2%] top-[20%]' },
  { label: 'Short Answer', count: 5, pos: 'right-0 top-[40%]' },
  { label: 'Long Answer', count: 3, pos: 'right-[8%] top-[60%]' },
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

  // Lightweight analytics derived from the loaded assignments: creation
  // cadence (sparkline), this-week vs last-week delta, and status ratios.
  const analytics = useMemo(() => {
    const DAY = 86_400_000;
    const now = Date.now();
    let thisWeek = 0;
    let prevWeek = 0;
    for (const a of items) {
      const t = new Date(a.createdAt).getTime();
      if (t >= now - 7 * DAY) thisWeek += 1;
      else if (t >= now - 14 * DAY) prevWeek += 1;
    }
    const sorted = [...items].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    let spark: number[] = [];
    if (sorted.length >= 2) {
      const min = new Date(sorted[0].createdAt).getTime();
      const max = new Date(sorted[sorted.length - 1].createdAt).getTime();
      const span = Math.max(1, max - min);
      const N = 7;
      const buckets = new Array<number>(N).fill(0);
      for (const a of sorted) {
        const f = (new Date(a.createdAt).getTime() - min) / span;
        buckets[Math.min(N - 1, Math.floor(f * N))] += 1;
      }
      spark = buckets;
    }
    const loaded = Math.max(items.length, 1);
    return {
      spark,
      weekDelta: thisWeek - prevWeek,
      readyPct: Math.round((stats.ready / loaded) * 100),
      workingPct: Math.round((stats.working / loaded) * 100),
    };
  }, [items, stats]);

  const recent = useMemo(
    () =>
      [...items]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4),
    [items],
  );

  const firstName = (teacherName || '').trim().split(/\s+/)[0] || 'there';

  // Live clock — keeps the greeting (morning/afternoon/evening) and date fresh
  // without a reload. null on first render to avoid SSR/client hydration drift.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="px-4 lg:px-0 pb-24 lg:pb-12">
      <Topbar title="Home" showBack={false} />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 px-6 py-6 text-white lg:px-8 lg:py-7">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-56 w-56 rounded-full bg-accent-400/15 blur-3xl" />

        {/* Ambient sparkle field across the whole hero (subtle on all sizes) */}
        <div className="pointer-events-none absolute inset-0 select-none" aria-hidden>
          <Sparkle className="absolute left-[42%] top-6 h-3 w-3 text-white/40" fill="currentColor" />
          <Sparkle className="absolute right-[30%] bottom-8 h-3.5 w-3.5 text-white/30" fill="currentColor" />
          <span className="absolute right-[40%] top-1/3 h-1 w-1 rounded-full bg-white/40" />
        </div>

        {/* Right-side scene: blended mark, dashed flight-paths, floating
            question-type pills and an answer-key checklist. Shown on wide
            screens where there's room; hidden below xl so copy stays legible. */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] select-none xl:block" aria-hidden>
          <svg className="absolute inset-0 h-full w-full opacity-40" viewBox="0 0 480 260" fill="none">
            <path
              d="M40 150 C 120 60, 250 60, 330 110"
              stroke="white"
              strokeWidth="1.5"
              strokeDasharray="2 7"
              strokeLinecap="round"
            />
            <path
              d="M330 150 C 410 120, 440 70, 470 40"
              stroke="white"
              strokeWidth="1.5"
              strokeDasharray="2 7"
              strokeLinecap="round"
            />
          </svg>

          {/* Mark framed as a rounded tile so its square white background reads
              as a deliberate panel with soft corners instead of a hard box. */}
          <img
            src="/brand/mark.png"
            alt=""
            className="absolute right-[24%] top-1/2 h-44 -translate-y-1/2 rounded-[24px] opacity-95 shadow-[0_24px_55px_rgba(8,20,60,0.45)] ring-1 ring-white/25"
          />

          {HERO_PILLS.map((p) => (
            <span
              key={p.label}
              className={cn(
                'absolute inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[13px] font-medium text-white shadow-sm backdrop-blur-md',
                p.pos,
              )}
            >
              {p.label}
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-[12px] font-bold tabular-nums">
                {p.count}
              </span>
            </span>
          ))}

          <div className="absolute bottom-[8%] right-[6%] flex flex-col gap-2">
            {['w-20', 'w-14', 'w-16'].map((w, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-brand-900">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span className={cn('h-2 rounded-full bg-white/30', w)} />
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex max-w-2xl flex-col xl:max-w-[56%]">
          <p className="flex items-center gap-1.5 text-[13px] font-medium uppercase tracking-[0.14em] text-white/70">
            {now ? `${greeting(now)}, ${firstName}` : 'Welcome'}
            {now && <TimeIcon date={now} className="h-4 w-4 text-amber-300" />}
          </p>
          <h1 className="mt-1 text-[26px] font-bold leading-[1.05] tracking-[-0.02em] lg:text-[36px]">
            Create. Assess. Inspire.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/80 lg:text-[15px]">
            AI that understands your classroom.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {HERO_FEATURES.map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="flex flex-col gap-1.5 rounded-2xl border border-white/15 bg-white/5 p-2.5 backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white ring-1 ring-inset ring-white/10">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="text-[13px] font-semibold leading-tight tracking-[-0.01em]">{title}</div>
                <div className="text-[11px] leading-snug text-white/65">{desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/assignments/new"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-brand-700 shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.99]"
            >
              <Sparkles className="h-[17px] w-[17px] text-accent-500" />
              Create assignment
            </Link>
            <Link
              href="/assignments"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 text-[14px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              View all
              <ArrowRight className="h-[17px] w-[17px]" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total assignments"
          value={total}
          loading={loading}
          tone={{ dot: 'bg-brand-600', bar: 'bg-brand-600', accent: 'text-brand-600' }}
          trend={analytics.weekDelta}
          spark={analytics.spark}
        />
        <StatCard
          label="Ready"
          value={stats.ready}
          loading={loading}
          tone={{ dot: 'bg-status-ready', bar: 'bg-status-ready', accent: 'text-status-ready' }}
          progress={analytics.readyPct}
          progressLabel={`${analytics.readyPct}% of recent`}
        />
        <StatCard
          label="Generating"
          value={stats.working}
          loading={loading}
          pulse
          tone={{ dot: 'bg-status-processing', bar: 'bg-status-processing', accent: 'text-status-processing' }}
          progress={analytics.workingPct}
          progressLabel={stats.working > 0 ? 'Active now' : 'All caught up'}
        />
        <StatCard
          label="Saved papers"
          value={savedCount}
          loading={false}
          tone={{ dot: 'bg-accent-500', bar: 'bg-accent-500', accent: 'text-accent-600' }}
          hint={savedCount > 0 ? 'Bookmarked' : 'None saved yet'}
        />
      </div>

      {/* Recent assignments */}
      <div className="mt-6">
        <section>
          <SectionHeader
            eyebrow="Pick up where you left off"
            title="Recent assignments"
            href="/assignments"
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
      </div>
    </div>
  );
}

interface StatTone {
  dot: string;
  bar: string;
  accent: string;
}

function StatCard({
  label,
  value,
  loading,
  tone,
  trend,
  spark,
  progress,
  progressLabel,
  hint,
  pulse,
}: {
  label: string;
  value: number;
  loading: boolean;
  tone: StatTone;
  trend?: number;
  spark?: number[];
  progress?: number;
  progressLabel?: string;
  hint?: string;
  pulse?: boolean;
}) {
  const active = value > 0;
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface px-4 py-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <span
            className={cn(
              'h-1.5 w-1.5 shrink-0 rounded-full',
              active ? tone.dot : 'bg-border-strong',
              active && pulse && 'animate-pulse',
            )}
          />
          <span className="truncate text-[12px] font-medium text-ink-muted">{label}</span>
        </span>
        {trend !== undefined && !loading && <TrendPill delta={trend} />}
      </div>

      {loading ? (
        <div className="h-[30px] w-12 animate-pulse rounded-md bg-surface-alt" />
      ) : (
        <div
          className={cn(
            'text-[30px] font-bold leading-none tracking-[-0.02em] tabular-nums',
            active ? 'text-ink' : 'text-ink-subtle',
          )}
        >
          {value}
        </div>
      )}

      {!loading && (
        <div className="flex h-7 items-end">
          {spark && spark.length >= 2 ? (
            <Sparkline
              data={spark}
              className={cn('h-7 w-full', active ? tone.accent : 'text-border-strong')}
            />
          ) : progress !== undefined ? (
            <div className="w-full">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
                <div
                  className={cn('h-full rounded-full transition-all', active ? tone.bar : 'bg-border-strong')}
                  style={{ width: `${active ? Math.max(6, Math.min(100, progress)) : 0}%` }}
                />
              </div>
              <div className={cn('mt-1.5 text-[11px] font-medium', active ? tone.accent : 'text-ink-subtle')}>
                {progressLabel}
              </div>
            </div>
          ) : hint ? (
            <span className={cn('text-[11px] font-medium', active ? tone.accent : 'text-ink-subtle')}>
              {hint}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

function TrendPill({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <span
        title="vs last week"
        className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-status-ready-bg px-1.5 py-0.5 text-[10px] font-semibold text-status-ready"
      >
        <ArrowUpRight className="h-3 w-3" />+{delta} wk
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span
        title="vs last week"
        className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-status-failed-bg px-1.5 py-0.5 text-[10px] font-semibold text-status-failed"
      >
        <ArrowDownRight className="h-3 w-3" />
        {delta} wk
      </span>
    );
  }
  return (
    <span
      title="vs last week"
      className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-surface-alt px-1.5 py-0.5 text-[10px] font-semibold text-ink-subtle"
    >
      <Minus className="h-3 w-3" />0 wk
    </span>
  );
}

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const W = 100;
  const H = 28;
  const max = Math.max(1, ...data);
  const step = data.length > 1 ? W / (data.length - 1) : W;
  const pts = data.map((v, i) => [i * step, H - (v / max) * (H - 4) - 2] as const);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={className} aria-hidden>
      <path d={area} className="fill-current opacity-[0.12]" />
      <path
        d={line}
        className="fill-none stroke-current"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last[0]} cy={last[1]} r={2.5} className="fill-current" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function SectionHeader({
  eyebrow,
  title,
  href,
  cta = 'View all',
}: {
  eyebrow: string;
  title: string;
  href: string;
  cta?: string;
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
        className="group/sh inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-brand-700 hover:text-brand-800"
      >
        {cta}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/sh:translate-x-0.5" />
      </Link>
    </div>
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
