import { decodeXML } from 'entities';
import { fetch } from 'undici';
import { URLSearchParams } from 'url';
import { setInterval } from 'timers';
import { Reddit } from './types/BadMeme.d';

export { Reddit };

export interface IBadMemeCache {
    nsfw: boolean
    url: string | string[]
}

export const cache = new Map<string, Set<IBadMemeCache>>();
const lastUsed = new Map<string, number>();
const after = new Map<string, string>();

const getItemRespectNSFW = (
    subreddit: string, 
    allowNSFW: boolean,
    cachedItems = cache.get(subreddit)
): IBadMemeCache | null => {
    if (!cachedItems || cachedItems.size === 0) {
        return null;
    }

    const item = [...cachedItems].find(p => allowNSFW || !p.nsfw);
    if (item) {
        cachedItems.delete(item);
        cachedItems.size === 0 
            ? cache.delete(subreddit)
            : cache.set(subreddit, cachedItems);
    }

    lastUsed.set(subreddit, Date.now());
    return item || null;
}

export const badmeme = async (subreddit = 'dankmemes', nsfw = false) => {
    subreddit = subreddit.toLowerCase();

    if (cache.has(subreddit)) {
        return getItemRespectNSFW(subreddit, nsfw);
    }

    const o = new URLSearchParams({ limit: '100' });
    if (after.has(subreddit))
        o.set('after', after.get(subreddit)!);

    // https://www.reddit.com/dev/api#GET_new
    const r = await fetch(`https://www.reddit.com/r/${subreddit}/new.json?${o}`);
    const j = await r.json() as Reddit;

    if ('error' in j) {
        return j as {
            message: string;
            error: number;
            reason: string;
        };
    } else if (!j.data || j.data.children.length === 0) {
        return null;
    }

    const urls: IBadMemeCache[] = [];

    for (const { data } of j.data.children) {
        if (data.is_self || 'crosspost_parent' in data) { // text posts
            continue;
        }

        if (data.is_gallery && data.media_metadata) {
            const images: string[] = [];

            for (const entry of Object.values(data.media_metadata)) {
                if (entry.status !== 'valid') {
                    continue;
                }

                const url = 'u' in entry.s ? entry.s.u : entry.s.mp4;
                images.push(decodeXML(url));
            }

            urls.push({ nsfw: data.over_18, url: images });
            continue;
        }

        urls.push({ nsfw: data.over_18, url: data.url });
    }

    const last = j.data.children.at(-1)!.data.name;
    const cachedSet = new Set(urls);
    after.set(subreddit, last);
    cache.set(subreddit, cachedSet);

    return getItemRespectNSFW(subreddit, nsfw, cachedSet);
}

setInterval(() => {
    const now = Date.now();
    lastUsed.forEach((time, subreddit) => {
        if (now - time >= 60 * 1000 * 10) { // 10 mins
            lastUsed.delete(subreddit);
            cache.delete(subreddit);
            after.delete(subreddit);
        }
    });
}, 60 * 1000 * 10).unref();