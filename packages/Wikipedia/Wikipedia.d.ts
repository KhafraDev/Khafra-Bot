import { WikipediaSearch, WikipediaSummary } from './types/Wikipedia';
export declare const search: (query: string) => Promise<WikipediaSearch>;
export declare const getArticleById: (id: number) => Promise<WikipediaSummary<number>>;
