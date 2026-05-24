'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useNotificationsStore } from '@/store/useNotificationsStore';

const SHOW_MS = 1500;
const FADE_MS = 250;

export function NotificationToast() {
  const toast = useNotificationsStore((s) => s.toast);
  const dismissToast = useNotificationsStore((s) => s.dismissToast);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const hideTimer = setTimeout(() => setVisible(false), SHOW_MS);
    const removeTimer = setTimeout(() => dismissToast(), SHOW_MS + FADE_MS);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, [toast, dismissToast]);

  if (!toast) return null;

  const Icon =
    toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertCircle : Info;
  const iconColor =
    toast.type === 'success'
      ? 'text-emerald-400'
      : toast.type === 'error'
        ? 'text-red-400'
        : 'text-blue-400';

  return (
    <div
      className={`fixed left-1/2 top-20 z-[100] -translate-x-1/2 transition-all duration-200 ${
        visible ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 -translate-y-2'
      }`}
      aria-live="polite"
      role="status"
    >
      <div className="flex items-center gap-3 rounded-full bg-[#181818] px-5 py-3 text-white shadow-[0px_16px_48px_rgba(0,0,0,0.25)]">
        <Icon className={`h-5 w-5 ${iconColor}`} />
        <span className="text-[14px] font-semibold leading-[140%] tracking-[-0.02em]">
          {toast.message}
        </span>
      </div>
    </div>
  );
}
