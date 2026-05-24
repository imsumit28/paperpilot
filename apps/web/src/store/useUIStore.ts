'use client';

import { create } from 'zustand';

export interface ToolkitOption {
  id: string;
  label: string;
  description?: string;
  /** Text appended to additionalInfo before regeneration. */
  additionalInfoAppend: string;
}

interface ToolkitState {
  active: boolean;
  busy: boolean;
  onAction?: (option: ToolkitOption) => void | Promise<void>;
}

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toolkit: ToolkitState;
  enableToolkit: (onAction: (option: ToolkitOption) => void | Promise<void>) => void;
  disableToolkit: () => void;
  setToolkitBusy: (busy: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toolkit: { active: false, busy: false },
  enableToolkit: (onAction) => set({ toolkit: { active: true, busy: false, onAction } }),
  disableToolkit: () => set({ toolkit: { active: false, busy: false } }),
  setToolkitBusy: (busy) =>
    set((state) => ({ toolkit: { ...state.toolkit, busy } })),
}));
