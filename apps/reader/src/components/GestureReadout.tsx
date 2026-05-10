import { useEffect, useState } from 'react';

export function GestureReadout({ getGesture }: { getGesture: () => string }) {
  const [g, setG] = useState('none');
  useEffect(() => {
    const t = setInterval(() => setG(getGesture()), 100);
    return () => clearInterval(t);
  }, [getGesture]);
  return (
    <div className="fixed bottom-4 left-4 rounded bg-neutral-800/80 px-3 py-1 text-sm">
      ✋ {g}
    </div>
  );
}
