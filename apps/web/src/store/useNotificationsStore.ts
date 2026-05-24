'use client';

import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationItem {
  id: string;
  assignmentId?: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: number;
  read: boolean;
}

export interface ToastSnapshot {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
}

interface State {
  items: NotificationItem[];
  toast: ToastSnapshot | null;
  addCompletion: (input: { assignmentId: string; title: string }) => void;
  addFailure: (input: { assignmentId: string; title: string; message?: string }) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  clear: () => void;
  dismissToast: () => void;
}

function genId(): string {
  return Math.random().toString(36).slice(2);
}

const DEDUPE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_ITEMS = 50;

export const useNotificationsStore = create<State>((set, get) => ({
  items: [],
  toast: null,

  addCompletion: ({ assignmentId, title }) => {
    const existing = get().items.find(
      (i) =>
        i.assignmentId === assignmentId &&
        i.type === 'success' &&
        Date.now() - i.createdAt < DEDUPE_WINDOW_MS,
    );
    if (existing) return;
    const item: NotificationItem = {
      id: genId(),
      assignmentId,
      title,
      message: `${title} generated`,
      type: 'success',
      createdAt: Date.now(),
      read: false,
    };
    set((s) => ({
      items: [item, ...s.items].slice(0, MAX_ITEMS),
      toast: { id: item.id, title, message: `${title} generated`, type: 'success' },
    }));
  },

  addFailure: ({ assignmentId, title, message }) => {
    const existing = get().items.find(
      (i) =>
        i.assignmentId === assignmentId &&
        i.type === 'error' &&
        Date.now() - i.createdAt < DEDUPE_WINDOW_MS,
    );
    if (existing) return;
    const item: NotificationItem = {
      id: genId(),
      assignmentId,
      title,
      message: message ?? `${title} failed`,
      type: 'error',
      createdAt: Date.now(),
      read: false,
    };
    set((s) => ({
      items: [item, ...s.items].slice(0, MAX_ITEMS),
      toast: { id: item.id, title, message: `${title} failed`, type: 'error' },
    }));
  },

  markAllRead: () =>
    set((s) => ({ items: s.items.map((i) => ({ ...i, read: true })) })),
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  clear: () => set({ items: [] }),
  dismissToast: () => set({ toast: null }),
}));
