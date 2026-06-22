import Link from 'next/link';
import {
  BookOpen,
  LayoutList,
  CheckSquare,
  ArrowRight,
  Check,
  Sparkles,
  Clock,
  GraduationCap,
} from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';

const TOOLS = [
  {
    href: '/toolkit/lesson-plan',
    Icon: BookOpen,
    label: 'Lesson Planner',
    desc: 'Generate structured lesson plans for any topic, grade, and duration.',
    color: 'bg-brand-50 text-brand-600',
    accent: 'text-brand-600',
    eta: '~20s',
    features: ['Learning objectives', 'Activities & practice', 'Assessment & homework', 'Differentiation tips'],
  },
  {
    href: '/toolkit/rubric',
    Icon: LayoutList,
    label: 'Rubric Builder',
    desc: 'Create clear, detailed grading rubrics for any assignment.',
    color: 'bg-accent-50 text-accent-600',
    accent: 'text-accent-600',
    eta: '~15s',
    features: ['Custom criteria', '4 performance levels', 'Even mark distribution', 'Ready-to-use table'],
  },
  {
    href: '/toolkit/grading',
    Icon: CheckSquare,
    label: 'Grading Assistant',
    desc: 'Get instant, constructive feedback on student responses.',
    color: 'bg-status-ready-bg text-status-ready',
    accent: 'text-status-ready',
    eta: '~25s',
    features: ['Score & justification', 'Mark breakdown', 'Strengths & gaps', 'Student-ready feedback'],
  },
];

const TRUST = [
  { Icon: Sparkles, label: 'Powered by DeepSeek AI' },
  { Icon: Clock, label: 'Generate in under 30 seconds' },
  { Icon: GraduationCap, label: 'Supports multiple grade levels' },
];

export default function ToolkitPage() {
  return (
    <div className="px-4 lg:px-0 pb-24 lg:pb-12">
      <Topbar title="AI Teacher's Toolkit" />

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink to-brand-900 px-6 py-7 text-white lg:px-9 lg:py-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-brand-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-accent-400/20 blur-3xl" />
        <div className="relative z-10">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/70">
            Free AI tools
          </p>
          <h1 className="mt-1 text-[26px] font-bold tracking-[-0.02em] lg:text-[32px]">
            AI Teacher&apos;s Toolkit
          </h1>
          <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-white/80">
            Plan lessons, build rubrics, and grade student work in seconds — powered by AI.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {TRUST.map(({ Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[12px] font-medium text-white/90 backdrop-blur-sm"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {TOOLS.map(({ href, Icon, label, desc, color, accent, eta, features }) => (
          <Link key={href} href={href}>
            <Card
              interactive
              className="group flex h-full flex-col hover:-translate-y-1 hover:shadow-raised"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-alt px-2.5 py-1 text-[11px] font-semibold text-ink-muted">
                  <Clock className="h-3 w-3" />
                  {eta}
                </span>
              </div>
              <div className="text-[16px] font-bold tracking-[-0.01em] text-ink">{label}</div>
              <div className="mt-1 text-sm leading-snug text-ink-muted">{desc}</div>

              <ul className="mt-4 flex-1 space-y-1.5">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[13px] text-ink">
                    <Check className={`h-3.5 w-3.5 shrink-0 ${accent}`} />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-5 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700">
                Open
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
