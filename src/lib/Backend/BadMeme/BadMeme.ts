import fetch from 'node-fetch';
import { RedditChildren, RedditNew, RedditNotFound } from './types/BadMeme';

interface RedditCache {
    posts: RedditChildren[],
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
                posts,
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
        (allowNSFW ? true : !p.data.over_18) &&
        p.data.thumbnail !== 'self' &&
        /(.gif|.png|.jpeg|.jpg)$/.test(p.data.url)
    );

    const first = filtered.shift();
    if(!first) return Promise.reject('No posts found!');
    
    cache.set(subreddit.toLowerCase(), {
        posts: posts.posts.filter(p => p.data.id !== first.data.id),
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