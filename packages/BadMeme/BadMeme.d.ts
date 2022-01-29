import { Reddit } from './types/BadMeme.d';
export { Reddit };
export interface IBadMemeCache {
    nsfw: boolean;
    url: string | string[];
}
export declare const cache: Map<string, Set<IBadMemeCache>>;
export declare const badmeme: (subreddit?: string, nsfw?: boolean) => Promise<IBadMemeCache | {
    message: string;
    error: number;
    reason: string;
} | null>;
