import { useContext } from 'react';
import { EngineContext } from './EngineProvider.js';

export function useEngine() {
  const ctx = useContext(EngineContext);
  if (!ctx) throw new Error('useEngine must be inside EngineProvider');
  return ctx;
}
