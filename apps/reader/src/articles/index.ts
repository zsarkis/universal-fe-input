import deathOfTheMoth from './death-of-the-moth.js';
import waldenExcerpt from './walden-excerpt.js';
import civilDisobedience from './civil-disobedience.js';

export interface Article {
  id: string;
  title: string;
  author: string;
  body: string; // plain prose, paragraphs separated by \n\n
  estimatedMinutes: number;
}

export const articles: Article[] = [deathOfTheMoth, waldenExcerpt, civilDisobedience];

export const findArticle = (id: string): Article | undefined => articles.find((a) => a.id === id);
