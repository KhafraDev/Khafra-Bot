import { Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { once } from '#khaf/utility/Memoize.js';
import { RSSReader } from '#khaf/utility/RSS.js';
import { type UnsafeEmbed } from '@discordjs/builders';
import { decodeXML } from 'entities';
import { request } from 'undici';

interface ITheOnionAPI {
    data: {
        id: number
        permalinkRedirect: null
        parentId: unknown
        parentAuthorId: unknown
        parentAuthorIds: unknown
        starterId: number
        publishTimeMillis: number
        lastUpdateTimeMillis: number
        timezone: string
        sharedUrl: unknown
        salesAvatar: unknown
        sponsored: boolean
        adSettings: unknown
        status: string
        authorId: string
        authorIds: string[]
        allowReplies: boolean
        showAuthorBio: boolean
        byline: string
        showByline: boolean
        categorization: {channelId: string, sectionId: string}
        storyTypeId: unknown
        categoryId: unknown
        subcategoryId: unknown
        properties:string
        template: unknown
        isFeatured: boolean
        isVideo: boolean
        isRoundup: boolean
        relatedModule: unknown
        defaultBlogId: number
        approved: boolean
        headline:string
        headlineSfw:string
        subhead: unknown[]
        body: unknown[]
        lightbox: boolean
        imageRights: string
        hideCredit: boolean
        type: string
        permalink: string
        plaintext: string
    }[]
}

interface ITheOnion {
    title: string
    link: string
    description: string
    category: string[]
    pubDate: string
    guid: number
    'dc:creator': string
}

const rss = new RSSReader<ITheOnion>();
const cache = once(async () => rss.cache('https://www.theonion.com/rss'));

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Read one of the latest articles from The Onion!',
                ''
            ],
            {
                name: 'theonion',
                folder: 'Fun',
                aliases: ['onion', 'realnews'],
                args: [0, 0]
            }
        );
    }

    async init (): Promise<UnsafeEmbed> {
        const state = await cache();

        if (state === null) {
            return Embed.error('Try again in a minute!');
        }

        const i = Math.floor(Math.random() * rss.results.size);
        const id = [...rss.results][i].guid;

        const { body } = await request(`https://theonion.com/api/core/corepost/getList?id=${id}`);
        const j = await body.json() as ITheOnionAPI;

        if (j.data.length === 0)
            return Embed.error(`
            You'll have to read the article on TheOnion this time, sorry!
            https://www.theonion.com/${id}
            `);

        return Embed.ok()
            .setAuthor({
                name: decodeXML(j.data[0].headline).slice(0, 256),
                iconURL: 'https://arc-anglerfish-arc2-prod-tronc.s3.amazonaws.com/public/3ED55FMQGXT2OG4GOBTP64LCYU.JPG',
                url: j.data[0].permalink
            })
            .setTimestamp(j.data[0].publishTimeMillis)
            .setDescription(j.data[0].plaintext.slice(0, 2048));
    }
}