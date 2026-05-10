import React, { createContext, useEffect, useMemo, useState } from 'react';
import { createInputEngine, type InputEngine } from '@input/core';
import { useSettings } from '../store/settings.js';

export interface EngineContextValue {
  engine: InputEngine;
  state: string;
  hoveredTargetId: string | null;
}

export const EngineContext = createContext<EngineContextValue | null>(null);

export function EngineProvider({ children }: { children: React.ReactNode }) {
  const engine = useMemo(() => createInputEngine(), []);
  const [state, setState] = useState<string>('IDLE');
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);
  const fusion = useSettings((s) => s.fusion);

  useEffect(() => {
    return engine.onState((e) => {
      setState(e.to);
      setHoveredTargetId(e.to === 'HOVERED' ? e.targetId ?? null : null);
    });
  }, [engine]);

  useEffect(() => {
    Object.assign(engine.config, fusion);
  }, [engine, fusion]);

  return (
    <EngineContext.Provider value={{ engine, state, hoveredTargetId }}>
      {children}
    </EngineContext.Provider>
  );
}
