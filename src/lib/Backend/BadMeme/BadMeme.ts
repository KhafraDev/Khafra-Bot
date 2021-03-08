import fetch from 'node-fetch';
import { IBadMeme } from './types/BadMeme.d';

interface IBadMemeCache {
    nsfw: boolean
    url: string
}

const cache = new Map<string, IBadMemeCache[]>();
const lastUsed = new Map<string, number>();

const getItemRespectNSFW = (subreddit: string, allowNSFW: boolean): IBadMemeCache | null => {
    if (!cache.has(subreddit))
        return null;

    const cached = cache.get(subreddit);
    // TODO: get random item so if the subreddit is removed from the cache
    // you can still see unique posts
    const item = cached.find(p => allowNSFW || !p.nsfw);
    if (item) {
        cached.splice(cached.indexOf(item), 1);
        cached.length === 0 
            ? cache.delete(subreddit)
            : cache.set(subreddit, cached);
    }

    lastUsed.set(subreddit, Date.now());
    return item || null;
}

export const badmeme = async (
    subreddit = 'dankmemes',
    nsfw = false
) => {
    subreddit = subreddit.toLowerCase();

    if (cache.has(subreddit)) {
        return getItemRespectNSFW(subreddit, nsfw);
    }

    const r = await fetch(`https://www.reddit.com/r/${subreddit}/new.json?limit=100`);
    const j = await r.json() as IBadMeme;

    const urls: IBadMemeCache[] = j.data.children
        .map(child => child.data)
        .filter(post => post.is_self === false)
        .map(post => {
            if (post.domain === 'gfycat.com') {
                if (!post.secure_media && !post.preview?.reddit_video_preview?.fallback_url)
                    return { nsfw: post.over_18, url: `${post.url}.mp4` };

                return { 
                    nsfw: post.over_18, 
                    url: post.secure_media 
                        ? post.secure_media.oembed.thumbnail_url
                        : post.preview.reddit_video_preview.fallback_url
                };
            }

            if (post.domain === 'redgifs.com')
                return { nsfw: post.over_18, url: post.url.replace('/watch/', '/ifr/') };

            if (post.post_hint === 'hosted:video')
                return { nsfw: post.over_18, url: post.media.reddit_video.fallback_url };

            return { nsfw: post.over_18, url: post.url };
        });

    cache.set(subreddit, urls);

    return getItemRespectNSFW(subreddit, nsfw);
}

setInterval(() => {
    const now = Date.now();
    lastUsed.forEach((time, subreddit) => {
        if (
            !cache.has(subreddit) || // can be deleted if cache is depleted
            now - time >= 60 * 1000 * 10 // 10 mins
        ) { // 10 mins
            lastUsed.delete(subreddit);
            cache.delete(subreddit);
        }
    });
}, 60 * 1000 * 10);