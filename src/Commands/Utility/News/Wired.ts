import { Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { once } from '#khaf/utility/Memoize.js';
import { RSSReader } from '#khaf/utility/RSS.js';
import { type UnsafeEmbed } from '@discordjs/builders';
import { decodeXML } from 'entities';

const settings = {
    rss: 'https://www.wired.com/feed/rss',
    main: 'https://www.wired.com',
    command: ['wired'],
    author: { name: 'Wired', iconURL: 'https://www.wired.com/images/logos/wired.png' }
} as const;

interface IWired {
    title: string
    link: string
    guid: string
    pubDate: string
    'media:content': string
    description: string
    category: string[]
    'media:keywords': string
    'dc:creator': string
    'dc:modified': string
    'dc:publisher': string
    'dc:subject': string
    'media:thumbnail': string
}

const rss = new RSSReader<IWired>();
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

    async init (): Promise<UnsafeEmbed> {
        const state = await cache();

        if (state === null) {
            return Embed.error('Try again in a minute!');
        }

        if (rss.results.size === 0) {
            return Embed.error('An unexpected error occurred!');
        }

        const posts = [...rss.results.values()];
        return Embed.ok()
            .setDescription(posts
                .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.link})`)
                .join('\n')
                .slice(0, 2048)
            )
            .setAuthor(settings.author);
    }
}