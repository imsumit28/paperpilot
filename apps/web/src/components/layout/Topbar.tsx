'use client';

'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, LayoutGrid, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/useUIStore';
import { VedaLogo } from './VedaLogo';
import { UserAvatar } from './UserAvatar';
import { NotificationsBell } from '@/components/notifications/NotificationsBell';
import { useAuthStore } from '@/store/useAuthStore';

interface TopbarProps {
  title?: string;
  showBack?: boolean;
}

export function Topbar({ title = 'Assignment', showBack = true }: TopbarProps) {
  const router = useRouter();
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const teacherName = useAuthStore((s) => s.teacherName);
  const schoolLogo = useAuthStore((s) => s.schoolLogo);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  function handleSignOut() {
    logout();
    setMenuOpen(false);
    router.replace('/auth');
  }

  return (
    <header className="sticky top-0 z-30 mb-4 bg-[rgba(255,255,255,0.01)] px-[10px] py-[18px] backdrop-blur-0 lg:mx-auto lg:mb-0 lg:h-[56px] lg:w-full lg:max-w-[1100px] lg:rounded-[16px] lg:bg-[rgba(255,255,255,0.75)] lg:px-[24px] lg:py-0 lg:flex lg:items-center">
      <div className="mx-auto flex h-[56px] w-full max-w-[373px] items-center justify-between rounded-[16px] bg-white px-[12px] pr-4 lg:h-full lg:max-w-none lg:rounded-none lg:bg-transparent lg:px-0 lg:pr-0 lg:gap-[10px]">
        {/* Mobile: VedaAI logo | Desktop: Back + label */}
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="lg:hidden flex items-center">
            <VedaLogo />
          </div>
          {showBack && (
            <button
              type="button"
              onClick={() => router.back()}
              className="hidden h-10 w-10 items-center justify-center rounded-full bg-white hover:bg-surface-alt lg:flex"
              aria-label="Back"
            >
              <ArrowLeft className="h-6 w-6 text-ink" strokeWidth={2.5} />
            </button>
          )}
          <div className="hidden h-[19px] flex-1 items-center gap-2 text-[16px] font-semibold leading-[19px] tracking-[-0.02em] text-ink-subtle lg:flex">
            <LayoutGrid className="h-5 w-5 shrink-0" strokeWidth={2} />
            <span>{title}</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center justify-end gap-3 w-[116px] lg:w-auto">
          <NotificationsBell />

          {/* Mobile: avatar + hamburger */}
          <div className="lg:hidden flex items-center gap-3">
            <div className="h-8 w-8 rounded-full overflow-hidden">
              <UserAvatar size={32} className="rounded-full" src={schoolLogo} alt={teacherName} />
            </div>
            <button
              type="button"
              className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-surface-alt"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-ink" strokeWidth={2} />
            </button>
          </div>

          {/* Desktop: Teacher pill */}
          <div ref={menuRef} className="hidden lg:block relative group">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              title={teacherName}
              aria-label={teacherName}
              className="flex items-center w-[157px] h-[44px] px-[12px] py-[6px] gap-2 rounded-xl bg-surface-alt hover:bg-border/60 transition-colors shadow-none"
            >
              <div className="h-8 w-8 rounded-full overflow-hidden bg-surface-alt shrink-0">
                <UserAvatar size={32} className="rounded-full overflow-hidden" src={schoolLogo} alt={teacherName} />
              </div>
              <div className="flex h-6 w-[93px] items-center gap-1">
                <span className="text-[16px] font-semibold leading-[19px] text-ink tracking-[-0.02em] truncate">{teacherName}</span>
                <ChevronDown className="h-6 w-6 text-ink-muted shrink-0" strokeWidth={1.5} />
              </div>
            </button>
            {/* Hover tooltip — only when name is wider than the pill can show */}
            {!menuOpen && (
              <div
                role="tooltip"
                className="pointer-events-none absolute right-0 top-[calc(100%+6px)] z-50 hidden max-w-[260px] whitespace-normal break-words rounded-lg bg-ink px-3 py-1.5 text-[12px] font-medium leading-tight text-white shadow-raised group-hover:block"
              >
                {teacherName}
              </div>
            )}
            {menuOpen && (
              <div className="absolute right-0 top-[50px] z-50 min-w-[200px] max-w-[280px] rounded-xl border border-border bg-white p-1 shadow-raised">
                <div className="px-3 py-2">
                  <div className="text-[13px] font-semibold text-ink break-words">{teacherName}</div>
                </div>
                <div className="my-1 h-px bg-border" />
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink hover:bg-surface-alt"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
