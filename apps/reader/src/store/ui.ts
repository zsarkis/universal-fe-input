import { create } from 'zustand';

interface UiState {
  helpOpen: boolean;
  setHelp: (open: boolean) => void;
}

export const useUi = create<UiState>((set) => ({
  helpOpen: false,
  setHelp: (helpOpen) => set({ helpOpen }),
}));
