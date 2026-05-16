import { useUi } from '../store/ui.js';

export function Toast() {
  const toast = useUi((s) => s.toast);
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed bottom-8 left-1/2 z-40 -translate-x-1/2 rounded-full bg-neutral-800/95 px-5 py-2 text-sm shadow-xl">
      {toast}
    </div>
  );
}
