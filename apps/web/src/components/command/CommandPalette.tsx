'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Sparkles,
  ClipboardList,
  BookOpen,
  FileText,
  Users,
  Settings,
  LayoutGrid,
  CornerDownLeft,
} from 'lucide-react';
import type { AssignmentDto } from '@paper-pilot/shared';
import { cn } from '@/lib/utils';
import { listAssignments } from '@/lib/api';
import { useCommandStore } from '@/store/useCommandStore';

type Icon = React.ComponentType<{ className?: string }>;
interface Item {
  id: string;
  label: string;
  sub?: string;
  href: string;
  icon: Icon;
}
interface Section {
  heading: string;
  items: Item[];
}

const NAV: Item[] = [
  { id: 'nav-create', label: 'Create assignment', sub: 'New AI question paper', href: '/assignments/new', icon: Sparkles },
  { id: 'nav-home', label: 'Home', href: '/home', icon: LayoutGrid },
  { id: 'nav-assignments', label: 'Assignments', href: '/assignments', icon: ClipboardList },
  { id: 'nav-toolkit', label: "AI Teacher's Toolkit", href: '/toolkit', icon: BookOpen },
  { id: 'nav-library', label: 'My Library', href: '/library', icon: FileText },
  { id: 'nav-groups', label: 'My Groups', href: '/groups', icon: Users },
  { id: 'nav-settings', label: 'Settings', href: '/settings', icon: Settings },
];

export function CommandPalette() {
  const open = useCommandStore((s) => s.open);
  const setOpen = useCommandStore((s) => s.setOpen);
  const toggle = useCommandStore((s) => s.toggle);
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Global shortcut: Cmd/Ctrl + K toggles the palette anywhere.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  // Lazy-load assignments the first time the palette opens.
  useEffect(() => {
    if (!open || loaded) return;
    listAssignments(1, 50)
      .then((d) => setAssignments(d.items))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [open, loaded]);

  // Reset query/selection and focus the input on open.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  const recent = useMemo(
    () =>
      [...assignments]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [assignments],
  );

  const sections: Section[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const toItem = (a: AssignmentDto): Item => ({
      id: a.id,
      label: a.title,
      sub: [a.subject, a.class && `Class ${a.class}`].filter(Boolean).join(' · '),
      href: `/assignments/${a.id}`,
      icon: ClipboardList,
    });

    if (!q) {
      return [
        { heading: 'Quick actions', items: NAV },
        ...(recent.length ? [{ heading: 'Recent activity', items: recent.map(toItem) }] : []),
      ];
    }
    const navMatches = NAV.filter((n) => n.label.toLowerCase().includes(q));
    const aMatches = assignments
      .filter((a) => a.title.toLowerCase().includes(q))
      .slice(0, 6)
      .map(toItem);
    return [
      ...(navMatches.length ? [{ heading: 'Actions', items: navMatches }] : []),
      ...(aMatches.length ? [{ heading: 'Assignments', items: aMatches }] : []),
    ];
  }, [query, assignments, recent]);

  const flat = useMemo(() => sections.flatMap((s) => s.items), [sections]);

  useEffect(() => {
    setActive((i) => Math.min(i, Math.max(0, flat.length - 1)));
  }, [flat.length]);

  function select(item: Item | undefined) {
    if (!item) return;
    setOpen(false);
    router.push(item.href);
  }

  // In-palette keyboard nav.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => Math.min(flat.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        select(flat[active]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, flat, active]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the active row in view.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  let idx = -1;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/40 px-4 pt-[12vh] animate-slide-up"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="w-full max-w-[600px] overflow-hidden rounded-2xl border border-border bg-surface shadow-float">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-[18px] w-[18px] shrink-0 text-ink-subtle" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search assignments, or jump to…"
            className="h-12 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-subtle"
          />
          <kbd className="hidden shrink-0 rounded-md border border-border bg-surface-alt px-1.5 py-0.5 text-[11px] font-medium text-ink-subtle sm:block">
            esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {flat.length === 0 ? (
            <div className="px-3 py-10 text-center text-sm text-ink-muted">
              No results for “{query.trim()}”.
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.heading} className="mb-1">
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
                  {section.heading}
                </div>
                {section.items.map((item) => {
                  idx += 1;
                  const i = idx;
                  const Icon = item.icon;
                  const isActive = i === active;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-idx={i}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => select(item)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                        isActive ? 'bg-brand-50' : 'hover:bg-surface-alt',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          isActive ? 'bg-brand-100 text-brand-700' : 'bg-surface-alt text-ink-muted',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[14px] font-medium text-ink">{item.label}</span>
                        {item.sub && <span className="truncate text-[12px] text-ink-muted">{item.sub}</span>}
                      </span>
                      {isActive && (
                        <CornerDownLeft className="h-4 w-4 shrink-0 text-brand-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
