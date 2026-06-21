'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Bell, CheckCircle2, Info, X } from 'lucide-react';
import { useNotificationsStore } from '@/store/useNotificationsStore';

function formatRelative(ts: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'just now';
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

export function NotificationsBell() {
  const items = useNotificationsStore((s) => s.items);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const remove = useNotificationsStore((s) => s.remove);
  const clear = useNotificationsStore((s) => s.clear);

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = items.filter((i) => !i.read).length;

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open && unreadCount > 0) {
      const t = setTimeout(() => markAllRead(), 400);
      return () => clearTimeout(t);
    }
  }, [open, unreadCount, markAllRead]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative h-9 w-9 flex items-center justify-center rounded-full bg-surface-alt hover:bg-border/60 lg:h-9 lg:w-9"
        aria-label={
          unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
        }
      >
        <Bell className="h-5 w-5 text-ink" strokeWidth={2} />
        {unreadCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-semibold leading-none text-white shadow-[0_0_0_2px_white]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : items.length > 0 ? (
          <span className="absolute top-[1px] right-[1px] h-2 w-2 rounded-full bg-accent-500" />
        ) : null}
      </button>

      {open && (
        <div className="fixed left-4 right-4 top-[80px] lg:absolute lg:left-auto lg:right-0 lg:top-12 z-40 lg:w-[320px] rounded-2xl border border-border bg-white shadow-raised">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-[14px] font-semibold tracking-[-0.02em] text-ink">
              Notifications
            </span>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => clear()}
                className="text-[12px] font-medium tracking-[-0.02em] text-ink-muted hover:text-ink"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto px-2 py-2">
            {items.length === 0 ? (
              <div className="px-3 py-8 text-center text-[13px] text-ink-subtle">
                No notifications yet.
              </div>
            ) : (
              <ul className="flex flex-col gap-1">
                {items.map((n) => {
                  const Icon =
                    n.type === 'success'
                      ? CheckCircle2
                      : n.type === 'error'
                        ? AlertCircle
                        : Info;
                  const color =
                    n.type === 'success'
                      ? 'text-status-ready'
                      : n.type === 'error'
                        ? 'text-status-failed'
                        : 'text-brand-600';
                  const body = (
                    <div className="flex items-start gap-3 rounded-xl px-3 py-2 hover:bg-surface-alt">
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold tracking-[-0.02em] text-ink">
                          {n.title}
                        </div>
                        <div className="truncate text-[12px] text-ink-muted">
                          {n.message}
                        </div>
                        <div className="mt-0.5 text-[11px] text-ink-subtle">
                          {formatRelative(n.createdAt)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          remove(n.id);
                        }}
                        aria-label="Dismiss"
                        className="shrink-0 rounded-full p-1 text-ink-subtle hover:bg-surface-alt hover:text-ink"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {n.assignmentId ? (
                        <Link
                          href={`/assignments/${n.assignmentId}`}
                          onClick={() => setOpen(false)}
                          className="block"
                        >
                          {body}
                        </Link>
                      ) : (
                        body
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
