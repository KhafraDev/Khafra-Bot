import { Command } from '#khaf/Command';
import { Embed, EmbedUtil } from '#khaf/utility/Constants/Embeds.js';
import { once } from '#khaf/utility/Memoize.js';
import { RSSReader } from '#khaf/utility/RSS.js';
import type { APIEmbed } from 'discord-api-types/v10';
import { decodeXML } from 'entities';

const settings = {
    rss: 'https://www.mirror.co.uk/news/world-news/?service=rss',
    main: 'https://www.mirror.co.uk',
    command: ['mirror'],
    author: { name: 'Mirror', iconURL: 'https://i.imgur.com/wuINM4z.png' }
} as const;

interface IMirrorCo {
    title: string
    link: string
    guid: string
    description: string
    pubDate: string
    category: string
    'media:thumbnail': string
    enclosure: string
    'media:content': string
    'media:keywords': string
}

const rss = new RSSReader<IMirrorCo>();
const cache = once(async () => rss.cache(settings.rss));

export class kCommand extends Command {
    constructor () {
        super(
            [
                `Get the latest articles from ${settings.main}!`
            ],
            {
                name: settings.command[0],
                folder: 'News',
                args: [0, 0],
                aliases: settings.command.slice(1)
            }
        );
    }

    async init (): Promise<APIEmbed> {
        const state = await cache();

        if (state === null) {
            return Embed.error('Try again in a minute!');
        }

        if (rss.results.size === 0) {
            return Embed.error('An unexpected error occurred!');
        }

        const posts = [...rss.results.values()];
        const embed = Embed.ok();
        EmbedUtil.setDescription(
            embed, posts
                .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.link})`)
                .join('\n')
                .slice(0, 2048)
        );

        return EmbedUtil.setAuthor(embed, settings.author);
    }
}