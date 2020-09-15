import fetch from 'node-fetch';
import { RedditNew, RedditNotFound, RedditChildren } from './types/BadMeme';

const cached: Map<string, RedditChildren[]> = new Map();

const getFromCache = (name: string, nsfw = false) => {
    const item = cached.get(name);
    const valid = item
        // if it is nsfw, include all results. if it's not, remove all that are over 18
        .filter(p => nsfw ? true : !p.data.over_18) 
        // remove any url that's not a valid image type
        .filter(p => /(.gif|.png|.jpeg|.jpg)$/.test(p.data.url));

    const single = valid[Math.floor(Math.random() * valid.length)];

    item.splice(item.indexOf(single), 1);
    cached.set(name, item);
    return single;
}

export const reddit = async (subreddit = 'dankmemes', nsfw: boolean) => {
    if(cached.has(subreddit)) {
        return Promise.resolve(getFromCache(subreddit, nsfw));
    }

    const res = await fetch(`https://www.reddit.com/r/${encodeURIComponent(subreddit)}/new.json?limit=100`);
    if(res.status !== 200) {
        return Promise.reject(res);
    }

    const json = await res.json() as RedditNew | RedditNotFound;
    if('error' in json) {
        return Promise.reject(json);
    }

    cached.set(subreddit, json.data.children);
    return getFromCache(subreddit, nsfw);
}