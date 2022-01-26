import { decodeXML } from 'entities';
import { fetch } from 'undici';
import { URLSearchParams } from 'url';
import { setInterval } from 'timers';
import {
    RedditData,
    IRedditGfycat,
    IRedditImgur,
    RedditMediaMetadataSuccess,
    IRedditBadResp
} from './types/BadMeme.d';

export { RedditData, IRedditBadResp };

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

// no, doing <post>.domain === 'gfycat.com' does not work.
// I tried.
const isgfycat = (p: RedditData['data']['children'][number]['data']): p is IRedditGfycat => p.domain === 'gfycat.com';
const isImgur = (p: RedditData['data']['children'][number]['data']): p is IRedditImgur =>
    p.domain === 'imgur.com' || p.domain === 'i.imgur.com';

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
    } else if (j.data.children.length === 0) {
        return null;
    }

    const urls: IBadMemeCache[] = [];

    for (const { data } of j.data.children) {
        if (data.is_self === true && 'crosspost_parent' in data) {
            continue;
        } else if ('is_gallery' in data) {
            const galleryImages = Object
                .values(data.media_metadata)
                .filter((k): k is RedditMediaMetadataSuccess => k.status === 'valid' && !!k.s.u)
                .map(k => decodeXML(k.s.u!));

            urls.push({ nsfw: data.over_18, url: galleryImages });
        } else if (isgfycat(data)) {
            if (!data.secure_media && !data.preview.reddit_video_preview.fallback_url) {
                urls.push({ nsfw: data.over_18, url: `${data.url}.mp4` });
            } else {
                urls.push({ 
                    nsfw: data.over_18, 
                    url: data.secure_media 
                        ? data.secure_media.oembed.thumbnail_url
                        : data.preview.reddit_video_preview.fallback_url
                });
            }
        } else if (data.domain === 'redgifs.com') {
            urls.push({ nsfw: data.over_18, url: data.url });
        } else if (isImgur(data)) {
            if (!data.media && !data.secure_media) {
                urls.push({ nsfw: data.over_18, url: data.url });
            } else {
                const item = data.media ?? data.secure_media!;
                urls.push({ nsfw: data.over_18, url: item.oembed.thumbnail_url });
            }
        } else if ('post_hint' in data) {
            if (data.post_hint === 'image') {
                urls.push({ nsfw: data.over_18, url: data.url });
            } else {
                // reddit separates the video from the audio, so the best we can do is get the video
                // not gonna waste resources combining audio + video.
                // https://www.reddit.com/r/redditdev/comments/9a16fv/videos_downloading_without_sound/
                urls.push({ nsfw: data.over_18, url: data.media.reddit_video.fallback_url });
            }
        } else {
            urls.push({ nsfw: data.over_18, url: data.url });
        }
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