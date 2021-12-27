import { env } from 'process';
import { URL } from 'url';
import { fetch, Headers } from 'undici';
import { dontThrow } from '../Don\'tThrow.js';
import { URLFactory } from '../Valid/URL.js';

interface ImgurAlbum {
    data: {
        id: string
        title: string | null
        description: string | null
        datetime: number
        cover: string
        cover_edited: number | null
        cover_width: number
        cover_height: number
        account_url: unknown | null
        account_id: string | null
        privacy: string
        layout: string
        views: number
        link: string
        favorite: boolean
        nsfw: boolean
        section: unknown
        images_count: number
        in_gallery: boolean
        is_ad: boolean
        include_album_ads: boolean
        is_album: boolean
        images: {
            id: string
            title: string | null
            description: string | null
            datetime: number
            type: string
            animated: boolean
            width: number
            height: number
            size: number
            views: number
            bandwidth: number
            vote: unknown
            favorite: boolean
            nsfw: boolean | null
            section: unknown
            account_url: unknown
            account_id: unknown
            is_ad: boolean
            in_most_viral: boolean
            has_sound: boolean
            tags: string[]
            ad_type: number
            ad_url: string
            edited: string
            in_gallery: boolean
            link: string
        }[]
        ad_config: {
            safeFlags: string[]
            highRiskFlags: unknown[]
            unsafeFlags: string[]
            wallUnsafeFlags: unknown[]
            showsAds: boolean
        }
    }
    success: boolean
    status: 200
}

export class Imgur {
    static cache = new Map<string, { u: string[], t: string }>();
    static ratelimit = {
        'x-ratelimit-userlimit': -1,
        'x-ratelimit-userremaining': -1,
        'x-ratelimit-userreset': -1
    }

    static setRateLimits(headers: Headers) {
        for (const key of Object.keys(Imgur.ratelimit) as (keyof typeof Imgur.ratelimit)[]) {
            if (headers.has(key)) {
                Imgur.ratelimit[key] = Number(headers.get(key));
            }
        }
    }

    static async album(args: string[]) {
        if (env.IMGUR_CLIENT_ID === undefined) return;

        if (
            Imgur.ratelimit['x-ratelimit-userremaining'] === 0 && // ratelimit hit
            Date.now() < Imgur.ratelimit['x-ratelimit-userreset'] // not reset yet
        ) return;

        let album: URL | null = null;

        for (const arg of args) {
            if (arg.includes('imgur.com/a/') && URLFactory(arg) !== null) {
                const url = URLFactory(arg)!;

                if (
                    url.host !== 'imgur.com' || 
                    !url.pathname.startsWith('/a/') ||
                    url.pathname.length < 8
                ) {
                    continue;
                }

                album = url;
                break;
            }
        }

        if (album === null) return;

        const [,, hash] = album.pathname.split('/', 3);

        if (Imgur.cache.has(hash)) {
            return Imgur.cache.get(hash);
        }

        if (typeof hash !== 'string') return;

        const [err, r] = await dontThrow(fetch(`https://api.imgur.com/3/album/${hash}`, {
            headers: {
                'Authorization': `Client-ID ${env.IMGUR_CLIENT_ID}`
            }
        }));

        if (err !== null) return;

        Imgur.setRateLimits(r.headers);

        // on bad requests, the api will sometimes return html
        // this is a precaution because the api will not always return json
        const [jErr, j] = await dontThrow(r.json() as Promise<ImgurAlbum>);

        if (jErr !== null) return;

        const images = j.data.images.map(i => i.link);
        const cached = { u: images, t: j.data.title ?? 'Imgur Album' };
        Imgur.cache.set(hash, cached);

        // clear out old cache results
        if (Imgur.cache.size > 250) {
            while (Imgur.cache.size > 250) {
                const key = Imgur.cache.keys().next().value as string;
                Imgur.cache.delete(key);
            }
        }

        return cached;
    }
}