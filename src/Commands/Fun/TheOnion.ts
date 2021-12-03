import { Command } from '../../Structures/Command.js';
import { decodeXML } from 'entities';
import { RSSReader } from '../../lib/Utility/RSS.js';
import { once } from '../../lib/Utility/Memoize.js';
import { rand } from '../../lib/Utility/Constants/OneLiners.js';
import { fetch } from 'undici';

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
        approved: boolean,
        headline:string,
        headlineSfw:string,
        subhead: unknown[]
        body: unknown[]
        lightbox: boolean,
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
const cache = once(() => rss.cache(`https://www.theonion.com/rss`));

export class kCommand extends Command {
    constructor() {
        super(
            [ 
                'Read one of the latest articles from The Onion!',
                ''
            ],
			{
                name: 'theonion',
                folder: 'Fun',
                aliases: [ 'onion', 'realnews' ],
                args: [0, 0]
            }
        );
    }

    async init() {
        await cache();

        const i = await rand(rss.results.size);
        const id = [...rss.results][i].guid;

        const r = await fetch(`https://theonion.com/api/core/corepost/getList?id=${id}`);
        const j = await r.json() as ITheOnionAPI;

        if (j.data.length === 0)
            return this.Embed.fail(`
            You'll have to read the article on TheOnion this time, sorry!
            https://www.theonion.com/${id}
            `);

        return this.Embed.success()
            .setAuthor({
                name: decodeXML(j.data[0].headline).slice(0, 256), 
                iconURL: 'https://arc-anglerfish-arc2-prod-tronc.s3.amazonaws.com/public/3ED55FMQGXT2OG4GOBTP64LCYU.JPG',
                url: j.data[0].permalink
            })
            .setTimestamp(j.data[0].publishTimeMillis)
            .setDescription(j.data[0].plaintext.slice(0, 2048));
    }
}