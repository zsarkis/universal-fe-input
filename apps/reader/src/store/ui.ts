import { create } from 'zustand';

interface UiState {
  helpOpen: boolean;
  setHelp: (open: boolean) => void;
  summaryOpen: boolean;
  setSummary: (open: boolean) => void;
}

export const useUi = create<UiState>((set) => ({
  helpOpen: false,
  setHelp: (helpOpen) => set({ helpOpen }),
  summaryOpen: false,
  setSummary: (summaryOpen) => set({ summaryOpen }),
}));
