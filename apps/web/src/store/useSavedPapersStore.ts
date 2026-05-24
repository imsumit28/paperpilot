'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AssignmentDto } from '@paper-pilot/shared';

interface State {
  savedPapers: AssignmentDto[];
  savePaper: (assignment: AssignmentDto) => void;
  unsavePaper: (id: string) => void;
  isSaved: (id: string) => boolean;
}

export const useSavedPapersStore = create<State>()(
  persist(
    (set, get) => ({
      savedPapers: [],
      savePaper: (assignment) =>
        set((s) => ({
          savedPapers: s.savedPapers.some((p) => p.id === assignment.id)
            ? s.savedPapers
            : [assignment, ...s.savedPapers],
        })),
      unsavePaper: (id) =>
        set((s) => ({ savedPapers: s.savedPapers.filter((p) => p.id !== id) })),
      isSaved: (id) => get().savedPapers.some((p) => p.id === id),
    }),
    { name: 'saved-papers' },
  ),
);
