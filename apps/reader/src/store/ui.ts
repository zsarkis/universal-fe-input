import { create } from 'zustand';

interface UiState {
  helpOpen: boolean;
  setHelp: (open: boolean) => void;
  summaryOpen: boolean;
  setSummary: (open: boolean) => void;
  toast: string | null;
  showToast: (msg: string, ms?: number) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUi = create<UiState>((set) => ({
  helpOpen: false,
  setHelp: (helpOpen) => set({ helpOpen }),
  summaryOpen: false,
  setSummary: (summaryOpen) => set({ summaryOpen }),
  toast: null,
  showToast: (msg, ms = 1800) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: msg });
    toastTimer = setTimeout(() => set({ toast: null }), ms);
  },
}));
