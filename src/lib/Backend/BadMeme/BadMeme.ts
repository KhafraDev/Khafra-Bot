import fetch from 'node-fetch';
import { RedditNew, RedditNotFound, RedditPostMin } from './types/BadMeme';

interface RedditCache {
    posts: RedditPostMin[],
    updated: number
}

const cache = new Map<string, RedditCache>();

const retrieve = async (subreddit: string): Promise<RedditCache> => {
    subreddit = subreddit.toLowerCase();
    if(cache.has(subreddit)) {
        return cache.get(subreddit)!;
    }

    try {
        const res = await fetch(`https://www.reddit.com/r/${subreddit}/new.json?limit=100`);
        const json = await res.json() as RedditNew | RedditNotFound;

        if('error' in json) {
            return Promise.reject(json.message);
        } else {
            const posts = json.data.children;
            cache.set(subreddit, {
                posts: posts.map(p => ({
                    over_18: p.data.over_18,
                    thumbnail: p.data.thumbnail,
                    url: p.data.url,
                    id: p.data.id
                })),
                updated: Date.now()
            });
            return cache.get(subreddit)!;
        }
    } catch(e) {
        return Promise.reject(e.toString());
    }
}

export const reddit = async (subreddit = 'dankmemes', allowNSFW = false) => {
    let posts: RedditCache;
    try {
        posts = await retrieve(subreddit);
    } catch(e) {
        return Promise.reject(e);
    }

    const filtered = posts.posts.filter(p => 
        (allowNSFW ? true : !p.over_18) &&
        p.thumbnail !== 'self' &&
        /(.gif|.png|.jpeg|.jpg)$/.test(p.url)
    );

    const first = filtered.shift();
    if(!first) return Promise.reject('No posts found!');
    
    cache.set(subreddit.toLowerCase(), {
        posts: posts.posts.filter(p => p.id !== first.id),
        updated: Date.now()
    });
    return first;
}

setInterval(() => {
    const now = Date.now();
    cache.forEach((v, k) => {
        if(now - v.updated > 60 * 1000 * 10) { // 10 mins || 600,000 ms
            cache.delete(k);
        }
    });
}, 60 * 1000 * 10);