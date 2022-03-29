import { Reddit } from './types/BadMeme.d';
export { Reddit };
export interface IBadMemeCache {
    nsfw: boolean;
    url: string | string[];
}
export declare const cache: Map<string, Set<IBadMemeCache>>;
export declare const badmeme: (subreddit?: string, nsfw?: boolean, modifier?: `${SortBy}`, timeframe?: `${Timeframe}`) => Promise<IBadMemeCache | {
    message: string;
    error: number;
    reason?: string;
} | null>;
export declare enum SortBy {
    CONTROVERSIAL = "controversial",
    BEST = "best",
    HOT = "hot",
    NEW = "new",
    RANDOM = "random",
    RISING = "rising",
    TOP = "top"
}
export declare enum Timeframe {
    HOUR = "hour",
    DAY = "day",
    WEEK = "week",
    MONTH = "month",
    YEAR = "year",
    ALL = "all"
}
