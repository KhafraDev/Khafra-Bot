import { decodeXML } from 'entities';
import fetch from 'node-fetch';
import { stringify } from 'querystring';
import { RedditData, IRedditGfycat, RedditMediaMetadataSuccess } from './types/BadMeme.d';

export interface IBadMemeCache {
    nsfw: boolean
    url: string | string[]
}

interface RedditReqOpts {
    limit: number
    after?: string
    // querystring#stringify requires an index signature 
    [key: string]: any
}

const cache = new Map<string, IBadMemeCache[]>();
const lastUsed = new Map<string, number>();
const after = new Map<string, string>();

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

// no, doing <post>.domain === 'gfycat.com' does not work.
// I tried.
const isgfycat = (p: RedditData['data']): p is IRedditGfycat => p.domain === 'gfycat.com';

export const badmeme = async (
    subreddit = 'dankmemes',
    nsfw = false
) => {
    subreddit = subreddit.toLowerCase();

    if (cache.has(subreddit)) {
        return getItemRespectNSFW(subreddit, nsfw);
    }

    const o: RedditReqOpts = { limit: 100 };
    if (after.has(subreddit))
        o.after = after.get(subreddit)!;

    // https://www.reddit.com/dev/api#GET_new
    const r = await fetch(`https://www.reddit.com/r/${subreddit}/new.json?${stringify(o)}`);
    const j = await r.json();

    const urls: IBadMemeCache[] = (j.data.children as RedditData[])
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
                return { nsfw: post.over_18, url: post.url.replace('/watch/', '/ifr/') };

            // reddit separates the video from the audio, so the best we can do is get the video
            // not gonna waste resources combining audio + video.
            // https://www.reddit.com/r/redditdev/comments/9a16fv/videos_downloading_without_sound/
            if ('post_hint' in post && post.post_hint === 'hosted:video')
                return { nsfw: post.over_18, url: post.media.reddit_video.fallback_url };

            return { nsfw: post.over_18, url: post.url };
        });

    const last = j.data.children[j.data.children.length - 1].data.name;
    after.set(subreddit, last);
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
            after.delete(subreddit);
        }
    });
}, 60 * 1000 * 10);