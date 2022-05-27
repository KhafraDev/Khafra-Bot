import type { Reddit } from './types/BadMeme.d';
export type { Reddit };
export interface IBadMemeCache {
    nsfw: boolean;
    url: string | string[];
}
export declare const cache: Map<string, Set<IBadMemeCache>>;
export declare const badmeme: (subreddit?: string, nsfw?: boolean, modifier?: (typeof SortBy)[keyof typeof SortBy], timeframe?: (typeof Timeframe)[keyof typeof Timeframe]) => Promise<IBadMemeCache | {
    message: string;
    error: number;
    reason?: string;
} | null>;
export declare const SortBy: {
    readonly CONTROVERSIAL: "controversial";
    readonly BEST: "best";
    readonly HOT: "hot";
    readonly NEW: "new";
    readonly RANDOM: "random";
    readonly RISING: "rising";
    readonly TOP: "top";
};
export declare const Timeframe: {
    readonly HOUR: "hour";
    readonly DAY: "day";
    readonly WEEK: "week";
    readonly MONTH: "month";
    readonly YEAR: "year";
    readonly ALL: "all";
};
