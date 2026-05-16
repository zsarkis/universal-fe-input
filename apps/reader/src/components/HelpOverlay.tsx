const COMMANDS: Array<[string, string]> = [
  ['open / select', 'open the thing you are looking at'],
  ['back', 'previous page'],
  ['scroll down / up', 'scroll the page'],
  ['top / bottom', 'jump to top/bottom'],
  ['next / previous paragraph', 'step paragraph-by-paragraph'],
  ['summarize', 'summarize current article'],
  ['bookmark', 'save your spot in this article'],
  ['cancel', 'abort the current action'],
  ['calibrate', 're-run gaze calibration'],
  ['help', 'show this overlay'],
];

export function HelpOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 bg-black/70 p-8" onClick={onClose}>
      <div
        className="mx-auto max-w-xl rounded-2xl bg-neutral-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl">Voice commands</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {COMMANDS.map(([cmd, desc]) => (
            <li key={cmd}><span className="font-mono">{cmd}</span> — {desc}</li>
          ))}
        </ul>
        <button className="mt-4 text-sm text-neutral-400" onClick={onClose}>close</button>
      </div>
    </div>
  );
}
