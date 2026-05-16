import { articles } from '../articles/index.js';
import { ArticleCard } from '../components/ArticleCard.js';

export function Library() {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-4xl">Library</h1>
      <p className="mt-2 text-neutral-400">Look at a card and pinch — or say "open."</p>
      <div className="mt-8 flex flex-col gap-6">
        {articles.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
    </div>
  );
}
