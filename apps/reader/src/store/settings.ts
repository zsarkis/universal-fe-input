import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_FUSION_CONFIG, type FusionConfig } from '@input/core';

interface State {
  enableGaze: boolean;
  enableHand: boolean;
  enableVoice: boolean;
  fusion: FusionConfig;
  apiKey: string | null;
  set: <K extends keyof Omit<State, 'set' | 'setFusion'>>(key: K, value: State[K]) => void;
  setFusion: <K extends keyof FusionConfig>(key: K, value: FusionConfig[K]) => void;
}

export const useSettings = create<State>()(
  persist(
    (set) => ({
      enableGaze: true,
      enableHand: true,
      enableVoice: true,
      fusion: { ...DEFAULT_FUSION_CONFIG },
      apiKey: null,
      set: (key, value) => set({ [key]: value } as Partial<State>),
      setFusion: (key, value) =>
        set((s) => ({ fusion: { ...s.fusion, [key]: value } })),
    }),
    { name: 'reader-settings' },
  ),
);
