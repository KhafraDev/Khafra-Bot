import { decodeXML } from 'entities';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { RedditData, IRedditGfycat, RedditMediaMetadataSuccess, IRedditBadResp } from './types/BadMeme.d';

export { RedditData, IRedditBadResp };

export interface IBadMemeCache {
    nsfw: boolean
    url: string | string[]
}

export const cache = new Map<string, Set<IBadMemeCache>>();
const lastUsed = new Map<string, number>();
const after = new Map<string, string>();

const getItemRespectNSFW = (subreddit: string, allowNSFW: boolean): IBadMemeCache | null => {
    if (!cache.has(subreddit))
        return null;

    const cached = cache.get(subreddit);
    const item = [...cached].find(p => allowNSFW || !p.nsfw);
    if (item) {
        cached.delete(item);
        cached.size === 0 
            ? cache.delete(subreddit)
            : cache.set(subreddit, cached);
    }

    lastUsed.set(subreddit, Date.now());
    return item || null;
}

// no, doing <post>.domain === 'gfycat.com' does not work.
// I tried.
const isgfycat = (p: RedditData['data']['children'][0]['data']): p is IRedditGfycat => p.domain === 'gfycat.com';

export const badmeme = async (
    subreddit = 'dankmemes',
    nsfw = false
) => {
    subreddit = subreddit.toLowerCase();

    if (cache.has(subreddit)) {
        return getItemRespectNSFW(subreddit, nsfw);
    }

    const o = new URLSearchParams({ limit: '100' });
    if (after.has(subreddit))
        o.set('after', after.get(subreddit)!);

    // https://www.reddit.com/dev/api#GET_new
    const r = await fetch(`https://www.reddit.com/r/${subreddit}/new.json?${o}`);
    const j = await r.json() as RedditData | IRedditBadResp;

    if ('error' in j) {
        return j;
    }

    const urls: IBadMemeCache[] = j.data.children
        .map(child => child.data)
        .filter(post => post.is_self === false && !('crosspost_parent' in post))
        .map(post => {
            if ('is_gallery' in post && post.is_gallery === true) {
                const galleryImages = Object
                    .values(post.media_metadata)
                    .filter((k): k is RedditMediaMetadataSuccess => k.status === 'valid')
                    .map(k => decodeXML(k.s.u));

                return { nsfw: post.over_18, url: galleryImages };
            }

            if (isgfycat(post)) {
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
                return { nsfw: post.over_18, url: post.url };

            // reddit separates the video from the audio, so the best we can do is get the video
            // not gonna waste resources combining audio + video.
            // https://www.reddit.com/r/redditdev/comments/9a16fv/videos_downloading_without_sound/
            if ('post_hint' in post && post.post_hint === 'hosted:video')
                return { nsfw: post.over_18, url: post.media.reddit_video.fallback_url };

            return { nsfw: post.over_18, url: post.url };
        });

    const last = j.data.children[j.data.children.length - 1].data.name;
    after.set(subreddit, last);
    cache.set(subreddit, new Set(urls));

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
            after.delete(subreddit);
        }
    });
}, 60 * 1000 * 10);