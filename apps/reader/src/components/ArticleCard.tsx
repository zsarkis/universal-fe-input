import { Link } from 'react-router-dom';
import type { Article } from '../articles/index.js';
import { useGazeTarget } from '../engine/useGazeTarget.js';

export function ArticleCard({ article }: { article: Article }) {
  const { ref, hovered } = useGazeTarget<HTMLAnchorElement>();
  return (
    <Link
      ref={ref}
      to={`/read/${article.id}`}
      className={`block rounded-2xl p-6 transition-transform ${
        hovered ? 'scale-[1.03] outline outline-2 outline-blue-400' : 'bg-neutral-900 hover:bg-neutral-800'
      } bg-neutral-900`}
      data-target-id={article.id}
    >
      <div className="text-xs uppercase tracking-widest text-neutral-400">{article.author}</div>
      <h2 className="mt-2 text-2xl">{article.title}</h2>
      <div className="mt-4 text-sm text-neutral-500">~{article.estimatedMinutes} min read</div>
    </Link>
  );
}
