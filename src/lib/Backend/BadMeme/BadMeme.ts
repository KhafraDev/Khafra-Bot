import fetch from 'node-fetch';
import { RedditCache, RedditNew, RedditNotFound } from './types/BadMeme';

const cached: RedditCache = {}

export const reddit = async (subreddit = 'dankmemes', nsfw: boolean) => {
    if(cached[subreddit]?.res.data.children.length > 0) {
        const item = cached[subreddit].res;
        const random = item.data.children[Math.random() * item.data.children.length << 0];
        cached[subreddit].res.data.children.splice(item.data.children.indexOf(random), 1);

        return Promise.resolve(random);
    }

    const res = await fetch(`https://www.reddit.com/r/${encodeURIComponent(subreddit)}/new.json`);
    if(res.status !== 200) {
        return res;
    }

    const json = await res.json() as RedditNew | RedditNotFound;
    if('error' in json) {
        return json;
    }

    cached[subreddit] = {
        res: json
    };

    // remove .gifv and non-image/gif related results
    cached[subreddit].res.data.children = cached[subreddit].res.data.children
        .filter(i => [ '.png', '.jpg', '.jpeg', '.gif' ].some(j => i.data.url.endsWith(j)));
    // get the results from the cache
    // then if nsfw = true, don't filter
    // otherwise, remove all over_18 posts.
    const item = cached[subreddit].res.data.children.filter(e => nsfw ? true : e.data.over_18 === false);
    const random = item[Math.random() * item.length << 0];
    return random;
}