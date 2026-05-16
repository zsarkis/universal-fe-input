import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { findArticle } from '../articles/index.js';
import { useAutoScroll } from '../engine/useAutoScroll.js';
import { SummaryPanel } from '../components/SummaryPanel.js';

export function Reader() {
  useAutoScroll();
  const { id = '' } = useParams();
  const article = findArticle(id);
  const nav = useNavigate();

  useEffect(() => {
    if (!article) return;
    const saved = localStorage.getItem(`bookmark:${article.id}`);
    const y = saved ? Number(saved) : NaN;
    if (Number.isFinite(y) && y > 0) {
      requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'auto' }));
    }
  }, [article]);

  if (!article) {
    return (
      <div className="p-8">
        <p>Article not found.</p>
        <button onClick={() => nav('/')}>Back</button>
      </div>
    );
  }
  return (
    <>
      <article className="mx-auto max-w-prose px-8 py-16 text-lg leading-relaxed">
        <header className="mb-8">
          <div className="text-xs uppercase tracking-widest text-neutral-400">{article.author}</div>
          <h1 className="mt-2 text-4xl">{article.title}</h1>
        </header>
        {article.body.split('\n\n').map((p, i) => (
          <p key={i} className="mb-6">{p}</p>
        ))}
      </article>
      <SummaryPanel articleText={article.body} />
    </>
  );
}
