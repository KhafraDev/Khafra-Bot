import { Event } from '#khaf/Event';
import { LRU } from '#khaf/LRU';
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js';
import { hours } from '#khaf/utility/ms.js';
import { Events, type Message } from 'discord.js';
import { env } from 'node:process';
import { request, type Dispatcher } from 'undici';

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
    }
    success: boolean
    status: 200
}

interface ImgurCache {
    u: string[]
    t: string
}

export class Imgur {
    static cache = new LRU<string, ImgurCache>({ maxSize: 250, maxAgeMs: hours(24) });
    static ratelimit = {
        'x-ratelimit-userlimit': -1,
        'x-ratelimit-userremaining': -1,
        'x-ratelimit-userreset': -1
    }

    static setRateLimits (headers: Dispatcher.ResponseData['headers']): void {
        for (const key of Object.keys(Imgur.ratelimit) as (keyof typeof Imgur.ratelimit)[]) {
            const k = key.toLowerCase() as keyof typeof Imgur.ratelimit;
            if (k in headers) {
                Imgur.ratelimit[k] = Number(headers[k]);
            }
        }
    }

    static async album (hash: string): Promise<ImgurCache | undefined> {
        if (env.IMGUR_CLIENT_ID === undefined) return;

        if (
            Imgur.ratelimit['x-ratelimit-userremaining'] === 0 && // ratelimit hit
            Date.now() < Imgur.ratelimit['x-ratelimit-userreset'] // not reset yet
        ) {
            return;
        } else if (Imgur.cache.has(hash)) {
            return Imgur.cache.get(hash);
        }

        const { headers, body, statusCode } = await request(`https://api.imgur.com/3/album/${hash}`, {
            headers: {
                'Authorization': `Client-ID ${env.IMGUR_CLIENT_ID}`
            }
        });

        Imgur.setRateLimits(headers);

        if (statusCode !== 200) {
            return;
        }

        const j = await body.json() as ImgurAlbum;
        const images = j.data.images.map(i => i.link);
        const cached = { u: images, t: j.data.title ?? 'Imgur Album' };
        Imgur.cache.set(hash, cached);

        return cached;
    }
}

const albumRegex = /https?:\/\/(www\.)?imgur.com\/a\/(?<hash>[A-z0-9]{1,})/;

export class kEvent extends Event<typeof Events.MessageCreate> {
    name = Events.MessageCreate;

    async init (message: Message): Promise<void> {
        if (
            !message.content.includes('imgur.com/a/') &&
            message.embeds.every(embed => !embed.url?.includes('imgur.com/a/'))
        ) {
            return;
        }

        const hashMatch = message.content.includes('imgur.com/a/')
            ? message.content
            : message.embeds.find(embed => embed.url?.includes('imgur.com/a/'))!.url!;

        const hash = albumRegex.exec(hashMatch)?.groups as { hash: string } | undefined;

        if (hash === undefined) {
            return;
        }

        const imgur = await Imgur.album(hash.hash);

        if (imgur === undefined || !Array.isArray(imgur.u) || imgur.u.length < 2) {
            // TODO: add better error messages for logs!
            return;
        }

        let desc = `${imgur.u.length.toLocaleString()} Total Images\n`;
        for (const image of imgur.u) {
            const line = `${image}, `;
            if (desc.length + line.length > 2048) break;

            desc += line;
        }

        return void await message.reply({
            content:
                'You posted an Imgur album, which doesn\'t embed all of the images! ' +
                'Here are all the images in the album:',
            embeds: [
                Embed.json({
                    color: colors.ok,
                    description: desc.trim(),
                    title: imgur.t
                })
            ]
        });
    }
}