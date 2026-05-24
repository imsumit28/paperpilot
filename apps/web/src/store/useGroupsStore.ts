'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Group {
  id: string;
  name: string;
  class: string;
  subject: string;
  examType: string;
  createdAt: string;
}

interface State {
  groups: Group[];
  addGroup: (group: Omit<Group, 'id' | 'createdAt'>) => void;
  deleteGroup: (id: string) => void;
}

function genId() {
  return Math.random().toString(36).slice(2);
}

export const useGroupsStore = create<State>()(
  persist(
    (set) => ({
      groups: [],
      addGroup: (data) =>
        set((s) => ({
          groups: [
            { ...data, id: genId(), createdAt: new Date().toISOString() },
            ...s.groups,
          ],
        })),
      deleteGroup: (id) =>
        set((s) => ({ groups: s.groups.filter((g) => g.id !== id) })),
    }),
    { name: 'groups' },
  ),
);
