import Link from 'next/link';
import { BookOpen, LayoutList, CheckSquare } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';

const TOOLS = [
  {
    href: '/toolkit/lesson-plan',
    Icon: BookOpen,
    label: 'Lesson Planner',
    desc: 'Generate structured lesson plans for any topic, grade, and duration.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    href: '/toolkit/rubric',
    Icon: LayoutList,
    label: 'Rubric Builder',
    desc: 'Create clear, detailed grading rubrics for any assignment.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    href: '/toolkit/grading',
    Icon: CheckSquare,
    label: 'Grading Assistant',
    desc: 'Get instant, constructive feedback on student responses.',
    color: 'bg-emerald-50 text-emerald-600',
  },
];

export default function ToolkitPage() {
  return (
    <div className="px-4 lg:px-0">
      <Topbar title="AI Teacher's Toolkit" />
      <p className="text-sm text-ink-muted mb-5">
        Free AI-powered tools to help you plan, assess, and grade.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TOOLS.map(({ href, Icon, label, desc, color }) => (
          <Link key={href} href={href}>
            <Card className="hover:border-ink/20 transition-colors cursor-pointer h-full">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="font-semibold text-ink mb-1">{label}</div>
              <div className="text-sm text-ink-muted leading-snug">{desc}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
