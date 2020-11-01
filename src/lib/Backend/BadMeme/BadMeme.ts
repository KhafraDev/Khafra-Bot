import fetch from 'node-fetch';
import { RedditNew, RedditChildren, RedditNotFound } from './types/BadMeme';

const cached: Map<string, {
    nsfw: RedditChildren[],
    sfw: RedditChildren[]
}> = new Map();

const nsfwSubreddits: string[] = [];

export const reddit = async (subreddit = 'dankmemes', nsfw = false, rr = false): Promise<RedditChildren> => {
    subreddit = subreddit.toLowerCase();
    if(!nsfw && nsfwSubreddits.includes(subreddit)) {
        return null;
    }

    const posts = cached.get(subreddit);
    if(!nsfw) { // not allowing nsfw content
        if(posts?.sfw.length > 0) { // sfw posts are cached
            const first = posts.sfw.shift();
            posts.sfw.splice(posts.sfw.indexOf(first), 1);
            cached.set(subreddit, posts);
            return first;
        } else if(rr) {
            return null;
        }
    } else {
        const all = [...(posts?.nsfw ?? []), ...(posts?.sfw ?? [])];
        if(all.length > 0) {
            const random = all[Math.floor(Math.random() * all.length)];
            posts[random.data.over_18 ? 'nsfw' : 'sfw'].splice(posts[random.data.over_18 ? 'nsfw' : 'sfw'].indexOf(random), 1);
            cached.set(subreddit, posts);
            return random;
        } else if(rr) {
            return null;
        }
    }

    const res = await fetch(`https://www.reddit.com/r/${subreddit}/new.json?limit=100`);
    const json = await res.json() as RedditNew | RedditNotFound;
    if('error' in json) {
        return Promise.reject(json);
    } else if(json.data.children.every(p => p.data.over_18)) {
        nsfwSubreddits.push(subreddit);
    }

    const p = { 
        nsfw: posts?.nsfw ? [...posts.nsfw] : Array<RedditChildren>(), 
        sfw: posts?.sfw ? [...posts.sfw] : Array<RedditChildren>() 
    }

    json.data.children.forEach(v => {
        if(v.data.thumbnail === 'self' || 
           !/(.gif|.png|.jpeg|.jpg)$/.test(v.data.url)
        ) {
            return;
        }

        if(v.data.over_18) {
            p.nsfw.push(v);
        } else {
            p.sfw.push(v);
        }
    });

    cached.set(subreddit, p);
    return reddit(subreddit, nsfw, true);
}