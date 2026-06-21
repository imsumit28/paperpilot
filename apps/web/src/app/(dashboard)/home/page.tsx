import Link from 'next/link';
import { Sparkles, BookOpen, FileText, Users } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';

const TILES = [
  { href: '/assignments', label: 'Assignments', desc: 'Create + grade assessments', Icon: BookOpen, accent: false },
  { href: '/assignments/new', label: 'Create Assignment', desc: 'AI-generated question paper', Icon: Sparkles, accent: true },
  { href: '/library', label: 'My Library', desc: 'Saved papers and rubrics', Icon: FileText, accent: false },
  { href: '/groups', label: 'My Groups', desc: 'Class rosters', Icon: Users, accent: false },
];

export default function HomePage() {
  return (
    <div className="px-4 lg:px-0">
      <Topbar title="Home" showBack={false} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink tracking-[-0.02em]">Welcome back, John 👋</h1>
        <p className="text-sm text-ink-muted mt-1">Pick up where you left off, or start something new.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TILES.map((t) => (
          <Link key={t.href} href={t.href}>
            <Card interactive className={t.accent ? 'border-accent-200 bg-accent-50/40 hover:border-accent-300' : undefined}>
              <div className="flex items-center gap-3">
                <div
                  className={
                    t.accent
                      ? 'h-10 w-10 rounded-xl bg-accent-100 text-accent-600 flex items-center justify-center'
                      : 'h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center'
                  }
                >
                  <t.Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-ink tracking-[-0.01em]">{t.label}</div>
                  <div className="text-sm text-ink-muted">{t.desc}</div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
