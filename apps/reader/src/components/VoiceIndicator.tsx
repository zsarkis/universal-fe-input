import { useEffect, useState } from 'react';
import { useEngine } from '../engine/useEngine.js';

export function VoiceIndicator() {
  const { state } = useEngine();
  const [caption, setCaption] = useState<string | null>(null);

  useEffect(() => {
    if (!caption) return;
    const t = setTimeout(() => setCaption(null), 1500);
    return () => clearTimeout(t);
  }, [caption]);

  // Wire transcript captions in Task 3.13 once VoiceAdapter is connected.
  // For now, surface the fusion state as an accessibility cue.
  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-full bg-neutral-800/80 px-3 py-1 text-sm">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          state === 'DICTATING' || state === 'ARMED' ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'
        }`}
      />
      {state}
      {caption && <span className="ml-2 text-neutral-200">{caption}</span>}
    </div>
  );
}
