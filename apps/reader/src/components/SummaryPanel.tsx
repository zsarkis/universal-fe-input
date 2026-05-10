import { useEffect, useState } from 'react';
import { useUi } from '../store/ui.js';
import { useSettings } from '../store/settings.js';

export function SummaryPanel({ articleText }: { articleText: string }) {
  const { summaryOpen, setSummary } = useUi();
  const apiKey = useSettings((s) => s.apiKey);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!summaryOpen) {
      setText(null);
      setError(null);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const url = import.meta.env.VITE_SUMMARIZE_URL as string | undefined;
    if (!url) {
      setError('VITE_SUMMARIZE_URL not configured');
      setLoading(false);
      return;
    }
    fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(apiKey ? { 'x-anthropic-api-key': apiKey } : {}),
      },
      body: JSON.stringify({ text: articleText }),
      signal: ctrl.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = (await r.json()) as { summary: string };
        setText(j.summary);
      })
      .catch((e) => {
        if ((e as Error).name === 'AbortError') return;
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [summaryOpen, articleText, apiKey]);

  if (!summaryOpen) return null;
  return (
    <aside className="fixed right-0 top-0 z-30 h-full w-96 overflow-y-auto bg-neutral-900 p-6 shadow-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg">Summary</h3>
        <button className="text-sm text-neutral-400" onClick={() => setSummary(false)}>close</button>
      </div>
      {loading && <p className="mt-4 text-neutral-400">Summarizing…</p>}
      {error && <p className="mt-4 text-red-400">Error: {error}</p>}
      {text && <pre className="mt-4 whitespace-pre-wrap text-sm">{text}</pre>}
    </aside>
  );
}
