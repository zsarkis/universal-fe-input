import { useSettings } from '../store/settings.js';

export function Settings() {
  const s = useSettings();
  return (
    <div className="mx-auto max-w-2xl p-8 space-y-6">
      <h1 className="text-3xl">Settings</h1>
      <section className="space-y-2">
        <h2 className="text-xl">Modalities</h2>
        {(['enableGaze', 'enableHand', 'enableVoice'] as const).map((k) => (
          <label key={k} className="flex items-center gap-2">
            <input type="checkbox" checked={s[k]} onChange={(e) => s.set(k, e.target.checked)} />
            {k}
          </label>
        ))}
      </section>
      <section className="space-y-2">
        <h2 className="text-xl">Fusion timings (ms)</h2>
        {(['hoverDwellMs', 'armTimeoutMs', 'commitPinchMs', 'gazeAbortLeaveMs'] as const).map((k) => (
          <label key={k} className="flex items-center gap-3">
            <span className="w-40">{k}</span>
            <input
              type="range"
              min={0}
              max={1500}
              value={s.fusion[k]}
              onChange={(e) => s.setFusion(k, Number(e.target.value))}
            />
            <span className="w-12 text-right">{s.fusion[k]}</span>
          </label>
        ))}
      </section>
      <section className="space-y-2">
        <h2 className="text-xl">Anthropic API key (optional)</h2>
        <input
          type="password"
          className="w-full rounded bg-neutral-900 p-2"
          value={s.apiKey ?? ''}
          onChange={(e) => s.set('apiKey', e.target.value || null)}
          placeholder="sk-ant-…"
        />
      </section>
    </div>
  );
}
