'use client';

import { create } from 'zustand';
import { listAssignments } from '@/lib/api';

interface AssignmentCountState {
  count: number;
  loading: boolean;
  setCount: (n: number) => void;
  increment: (by?: number) => void;
  decrement: (by?: number) => void;
  refresh: () => Promise<void>;
}

export const useAssignmentCountStore = create<AssignmentCountState>((set, get) => ({
  count: 0,
  loading: false,
  setCount: (n) => set({ count: Math.max(0, n) }),
  increment: (by = 1) => set({ count: Math.max(0, get().count + by) }),
  decrement: (by = 1) => set({ count: Math.max(0, get().count - by) }),
  refresh: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const data = await listAssignments(1, 1);
      set({ count: data.total ?? 0 });
    } catch {
      // keep prior count on transient failure
    } finally {
      set({ loading: false });
    }
  },
}));
