'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Book,
  Flame,
  LayoutGrid,
  Loader2,
  Plus,
  Settings,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { listAssignments } from '@/lib/api';
import { VedaLogo } from './VedaLogo';
import { UserAvatar } from './UserAvatar';
import { useUIStore, type ToolkitOption } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

const PRIMARY: NavItem[] = [
  { href: '/home', label: 'Home', icon: LayoutGrid },
  { href: '/groups', label: 'My Groups', icon: MyGroupsIcon },
  { href: '/assignments', label: 'Assignments', icon: AssignmentsIcon },
  { href: '/toolkit', label: "AI Teacher's Toolkit", icon: Book },
  { href: '/library', label: 'My Library', icon: MyLibraryIcon },
];

const MUTED_COLOR = 'rgba(94, 94, 94, 0.8)';

const TOOLKIT_OPTIONS: Array<ToolkitOption & { Icon: React.ComponentType<{ className?: string }> }> = [
  {
    id: 'increase-hardness',
    label: 'Increase difficulty',
    description: 'Make questions noticeably harder',
    additionalInfoAppend:
      'Make every question noticeably harder than before. Shift the difficulty mix toward hard (about 20% easy, 30% moderate, 50% hard) and use more advanced vocabulary and multi-step reasoning.',
    Icon: Flame,
  },
  {
    id: 'decrease-hardness',
    label: 'Decrease difficulty',
    description: 'Make questions easier and clearer',
    additionalInfoAppend:
      'Make every question noticeably easier than before. Shift the difficulty mix toward easy (about 60% easy, 30% moderate, 10% hard) and use simpler, age-appropriate language.',
    Icon: Sparkles,
  },
  {
    id: 'more-questions',
    label: 'Add more questions',
    description: 'Add a few extra practice items',
    additionalInfoAppend:
      'Add 2-3 extra questions to the existing sections while keeping the same question types. Recalculate maximumMarks accordingly.',
    Icon: Plus,
  },
  {
    id: 'real-world',
    label: 'Add real-world examples',
    description: 'Ground questions in everyday scenarios',
    additionalInfoAppend:
      'Rewrite the questions to use real-world, everyday scenarios as context wherever possible, while preserving the same syllabus topics.',
    Icon: Wand2,
  },
];

function MyGroupsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.0053 0C19.1069 0 20 0.867353 20 1.93727V12.0627C20 12.8063 19.5687 13.452 18.9357 13.7767C18.7114 13.0842 18.552 12.599 18.4574 12.321C18.403 12.1608 18.3777 12.011 18.2979 11.8819C18.2236 11.7617 18.1006 11.6182 17.9791 11.4747L17.9521 11.4428C17.5516 10.968 17.0414 10.3553 16.609 9.82839C16.1946 9.32331 15.8524 8.89639 15.7181 8.78227C15.3989 8.51105 14.9468 8.21401 14.2686 8.21401H9.66755C9.62487 8.2067 9.53035 8.1911 9.41489 8.14943C8.91888 7.97045 7.88479 7.51948 7.36702 7.30995C6.21465 6.13586 5.35029 5.25332 4.77394 4.66235C4.72638 4.61361 4.61117 4.49397 4.42827 4.30347C4.20391 4.06978 3.83109 4.04594 3.57713 4.24907C3.32508 4.45067 3.28322 4.81013 3.48253 5.06133C5.29064 7.33994 6.21755 8.50276 6.2633 8.5498C6.37468 8.66433 6.70673 8.87699 7.11436 9.1439C7.53415 9.41875 8.03354 9.75 8.41755 10.0092C8.77511 10.2505 8.97606 10.3192 9.01596 10.655C9.10394 11.3955 9.21032 12.5105 9.33511 14H1.99468C0.893058 14 0 13.1326 0 12.0627V1.93727C0 0.867353 0.893058 0 1.99468 0H18.0053ZM15.7979 11.7915C15.9066 11.7819 16.0276 11.915 16.0771 11.9594C16.2486 12.1131 16.3003 12.1721 16.4096 12.2694C16.5691 12.4114 16.7331 12.5764 16.7553 12.6051C16.9727 12.99 17.2919 13.7639 17.4073 14L15.4654 14C15.5489 13.0617 15.6021 12.459 15.625 12.1919C15.6516 11.8819 15.6891 11.8011 15.7979 11.7915ZM12.4734 3.06088C11.1955 3.06088 10.1596 4.06699 10.1596 5.30811C10.1596 6.54922 11.1955 7.55534 12.4734 7.55534C13.7513 7.55534 14.7872 6.54922 14.7872 5.30811C14.7872 4.06699 13.7513 3.06088 12.4734 3.06088Z"
        fill="#5E5E5E"
        fillOpacity="0.8"
      />
    </svg>
  );
}

function AssignmentsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M7.5 14.1667H12.5" stroke="#303030" strokeWidth="2" strokeLinecap="round" />
      <path d="M7.5 10.8333H12.5" stroke="#303030" strokeWidth="2" strokeLinecap="round" />
      <path d="M7.5 7.5H8.33333" stroke="#303030" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M4.16667 5C4.16667 3.61929 5.28596 2.5 6.66667 2.5H10.9763C11.4183 2.5 11.8423 2.67559 12.1548 2.98816L15.3452 6.17851C15.6577 6.49107 15.8333 6.915 15.8333 7.35702V15C15.8333 16.3807 14.7141 17.5 13.3333 17.5H6.66667C5.28596 17.5 4.16667 16.3807 4.16667 15V5Z"
        stroke="#303030"
        strokeWidth="2"
      />
      <path d="M10.8333 2.5V4.16667C10.8333 6.00762 12.3257 7.5 14.1667 7.5H15.8333" stroke="#303030" strokeWidth="2" />
    </svg>
  );
}

function MyLibraryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M17.675 13.2417C17.1449 14.4954 16.3157 15.6002 15.2599 16.4594C14.2041 17.3187 12.954 17.9062 11.6187 18.1707C10.2834 18.4351 8.90369 18.3685 7.60013 17.9765C6.29656 17.5845 5.10886 16.8792 4.14086 15.9222C3.17285 14.9652 2.45402 13.7856 2.0472 12.4866C1.64039 11.1876 1.55797 9.80874 1.80717 8.47053C2.05637 7.13232 2.62959 5.87553 3.47671 4.81003C4.32384 3.74453 5.41907 2.90277 6.66667 2.35834"
        stroke="#5E5E5E"
        strokeOpacity="0.8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.3333 10C18.3333 8.90567 18.1178 7.82204 17.699 6.81099C17.2802 5.79994 16.6664 4.88129 15.8926 4.10746C15.1187 3.33364 14.2001 2.71981 13.189 2.30102C12.178 1.88224 11.0943 1.66669 10 1.66669V10H18.3333Z"
        stroke="#5E5E5E"
        strokeOpacity="0.8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Sidebar({ assignmentCount = 0 }: { assignmentCount?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const schoolName = useAuthStore((s) => s.schoolName);
  const schoolAddress = useAuthStore((s) => s.schoolAddress);
  const schoolLogo = useAuthStore((s) => s.schoolLogo);
  const toolkit = useUIStore((s) => s.toolkit);
  const [assignmentTotal, setAssignmentTotal] = useState(assignmentCount);
  const [toolkitOpen, setToolkitOpen] = useState(false);
  const toolkitMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!toolkit.active && toolkitOpen) {
      setToolkitOpen(false);
    }
  }, [toolkit.active, toolkitOpen]);

  useEffect(() => {
    if (!toolkitOpen) return;
    function onDocClick(e: MouseEvent) {
      if (toolkitMenuRef.current && !toolkitMenuRef.current.contains(e.target as Node)) {
        setToolkitOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [toolkitOpen]);

  async function handleToolkitOption(option: ToolkitOption) {
    if (toolkit.busy) return;
    setToolkitOpen(false);
    setSidebarOpen(false);
    try {
      await toolkit.onAction?.(option);
    } catch {
      /* handler reports its own error */
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadAssignmentCount() {
      try {
        const data = await listAssignments(1, 1);
        if (!cancelled) {
          setAssignmentTotal(data.total);
        }
      } catch {
        if (!cancelled) {
          setAssignmentTotal(assignmentCount);
        }
      }
    }

    loadAssignmentCount();

    return () => {
      cancelled = true;
    };
  }, [assignmentCount]);

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed lg:sticky lg:top-0 z-50 lg:z-0',
          'left-3 top-3 bottom-3 lg:w-[304px] lg:h-[820px] w-72',
          'lg:max-h-full lg:overflow-y-auto',
          'bg-white rounded-2xl border border-border/40',
          'shadow-[0px_16px_48px_rgba(0,0,0,0.12),0px_32px_48px_rgba(0,0,0,0.2)]',
          'flex flex-col p-6 transition-transform',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-[110%]',
        )}
      >
        <div className="flex items-center justify-between mb-8">
          <VedaLogo />
          <button
            type="button"
            className="lg:hidden h-8 w-8 flex items-center justify-center rounded-full hover:bg-[#F0F0F0]"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {toolkit.active ? (
          <div ref={toolkitMenuRef} className="relative brand-glow rounded-full mb-8">
            <button
              type="button"
              onClick={() => setToolkitOpen((v) => !v)}
              disabled={toolkit.busy}
              aria-haspopup="menu"
              aria-expanded={toolkitOpen ? 'true' : 'false'}
              className="create-assignment-shadow flex items-center justify-center gap-2.5 w-full h-[42px] rounded-full bg-[#272727] text-white font-medium text-base hover:bg-black/90 font-inter tracking-tight disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {toolkit.busy ? (
                <Loader2 className="h-[18px] w-[18px] animate-spin" />
              ) : (
                <Book className="h-[18px] w-[18px]" />
              )}
              <span>AI Teacher&apos;s Toolkit</span>
            </button>
            {toolkitOpen && !toolkit.busy && (
              <div
                role="menu"
                className="absolute left-0 right-0 top-[50px] z-50 rounded-2xl border border-border/40 bg-white p-2 shadow-[0px_16px_48px_rgba(0,0,0,0.18)]"
              >
                {TOOLKIT_OPTIONS.map(({ Icon, ...option }) => (
                  <button
                    key={option.id}
                    type="button"
                    role="menuitem"
                    onClick={() => handleToolkitOption(option)}
                    className="flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left hover:bg-[#F0F0F0]"
                  >
                    <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#303030]" />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm font-medium text-[#303030] tracking-[-0.02em]">
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="text-xs text-[#5E5E5E] leading-snug">
                          {option.description}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="brand-glow rounded-full mb-8">
            <button
              type="button"
              onClick={() => {
                router.push('/assignments/new');
                setSidebarOpen(false);
              }}
              className="create-assignment-shadow flex items-center justify-center gap-2.5 w-full h-[42px] rounded-full bg-[#272727] text-white font-medium text-base hover:bg-black/90 font-inter tracking-tight"
            >
              <Sparkles className="h-[18px] w-[18px]" />
              <span>Create Assignment</span>
            </button>
          </div>
        )}

        <nav className="flex flex-col gap-2">
          {PRIMARY.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const showBadge = item.href === '/assignments' && assignmentTotal > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 h-[38px] text-base tracking-[-0.04em]',
                  active
                    ? 'bg-[#F0F0F0] text-[#303030] font-medium'
                    : 'hover:bg-[#F0F0F0] hover:text-[#303030] font-normal',
                )}
                style={!active ? { color: MUTED_COLOR } : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className="inline-flex h-[20px] w-[34px] items-center justify-center rounded-[48px] bg-[#FF5623] px-[10px] text-[14px] font-semibold leading-[140%] tracking-[-0.04em] text-white shadow-[inset_0px_0px_32.3px_rgba(255,161,10,0.25)]">
                    {assignmentTotal}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <div className="flex flex-col gap-2">
          <Link
            href="/settings"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 h-[38px] text-base tracking-[-0.04em] font-normal hover:bg-[#F0F0F0] hover:text-[#303030]"
            style={{ color: MUTED_COLOR }}
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span>Settings</span>
          </Link>

          <div className="bg-[#F0F0F0] rounded-2xl p-3 flex items-center gap-2 h-20">
            <div className="shrink-0 w-[60px] h-14 rounded-[28px] overflow-hidden bg-[#E8DEF7]">
              <UserAvatar size={60} src={schoolLogo} alt={schoolName} />
            </div>
            <div className="min-w-0 flex flex-col">
              <div className="text-base font-bold text-[#303030] truncate tracking-[-0.04em] leading-[1.4]">
                {schoolName}
              </div>
              <div className="text-sm font-normal text-[#5E5E5E] truncate tracking-[-0.04em] leading-[1.4]">
                {schoolAddress}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
