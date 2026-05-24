'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { QuestionType } from '@paper-pilot/shared';

export interface QTypeRow {
  type: QuestionType;
  count: number;
  marks: number;
}

interface DraftState {
  title: string;
  subject: string;
  class: string;
  school: string;
  dueDate: string;
  questionTypes: QTypeRow[];
  additionalInfo: string;
  sourceText: string;
  fileName: string | null;
  set: (patch: Partial<DraftState>) => void;
  setRow: (idx: number, patch: Partial<QTypeRow>) => void;
  addRow: (type: QuestionType) => void;
  removeRow: (idx: number) => void;
  reset: () => void;
}

const DEFAULT_ROWS: QTypeRow[] = [
  { type: 'mcq', count: 4, marks: 1 },
  { type: 'short', count: 3, marks: 2 },
];

const initial = {
  title: '',
  subject: 'Science',
  class: '5',
  school: '',
  dueDate: '',
  questionTypes: DEFAULT_ROWS,
  additionalInfo: '',
  sourceText: '',
  fileName: null as string | null,
};

export const useAssignmentDraftStore = create<DraftState>()(
  persist(
    (set) => ({
      ...initial,
      set: (patch) => set(patch),
      setRow: (idx, patch) =>
        set((state) => ({
          questionTypes: state.questionTypes.map((row, i) => (i === idx ? { ...row, ...patch } : row)),
        })),
      addRow: (type) =>
        set((state) => {
          if (state.questionTypes.some((r) => r.type === type)) return state;
          return {
            questionTypes: [...state.questionTypes, { type, count: 5, marks: 2 }],
          };
        }),
      removeRow: (idx) =>
        set((state) => ({
          questionTypes: state.questionTypes.filter((_, i) => i !== idx),
        })),
      reset: () => set({ ...initial }),
    }),
    {
      name: 'paper-pilot-draft',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
