import { useEffect, useState } from 'react';

export function MicMeter({
  getRms,
  getThreshold,
}: {
  getRms: () => number;
  getThreshold: () => number;
}) {
  const [rms, setRms] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setRms(getRms()), 50);
    return () => clearInterval(t);
  }, [getRms]);
  const threshold = getThreshold();
  // Show RMS on a 0–0.1 scale; 0.01 (default threshold) is at 10%.
  const fillPct = Math.min(100, (rms / 0.1) * 100);
  const thresholdPct = Math.min(100, (threshold / 0.1) * 100);
  const over = rms >= threshold;
  return (
    <div className="fixed bottom-4 left-32 flex w-40 items-center gap-2 rounded bg-neutral-800/80 px-3 py-1 text-xs">
      🎙
      <div className="relative h-2 flex-1 overflow-hidden rounded bg-neutral-700">
        <div
          className={`h-full ${over ? 'bg-emerald-400' : 'bg-neutral-400'}`}
          style={{ width: `${fillPct}%` }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-yellow-400"
          style={{ left: `${thresholdPct}%` }}
        />
      </div>
    </div>
  );
}
