import { RedditData, IRedditBadResp } from './types/BadMeme.d';
export { RedditData, IRedditBadResp };
export interface IBadMemeCache {
    nsfw: boolean;
    url: string | string[];
}
export declare const badmeme: (subreddit?: string, nsfw?: boolean) => Promise<IBadMemeCache | IRedditBadResp>;
