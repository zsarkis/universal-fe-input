import { Link } from 'react-router-dom';
import type { Article } from '../articles/index.js';
import { useGazeTarget } from '../engine/useGazeTarget.js';

function teaser(body: string): string {
  const first = body.split('\n\n')[0] ?? '';
  if (first.length <= 180) return first;
  const cut = first.slice(0, 180);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : cut.length)}…`;
}

export function ArticleCard({ article }: { article: Article }) {
  const { ref, id, hovered } = useGazeTarget<HTMLAnchorElement>();
  return (
    <Link
      ref={ref}
      to={`/read/${article.id}`}
      className={`block rounded-2xl p-8 transition-transform ${
        hovered ? 'scale-[1.02] outline outline-2 outline-blue-400' : 'bg-neutral-900 hover:bg-neutral-800'
      } bg-neutral-900`}
      data-target-id={id}
    >
      <div className="text-xs uppercase tracking-widest text-neutral-400">{article.author}</div>
      <h2 className="mt-2 text-3xl">{article.title}</h2>
      <p className="mt-4 text-base text-neutral-300">{teaser(article.body)}</p>
      <div className="mt-6 text-sm text-neutral-500">~{article.estimatedMinutes} min read</div>
    </Link>
  );
}
