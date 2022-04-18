import { Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { once } from '#khaf/utility/Memoize.js';
import { RSSReader } from '#khaf/utility/RSS.js';
import { type UnsafeEmbedBuilder } from '@discordjs/builders';
import { decodeXML } from 'entities';

const settings = {
    rss: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml',
    main: 'https://news.un.org/en/',
    command: ['un'],
    author: { name: 'UN', iconURL: 'http://lofrev.net/wp-content/photos/2014/10/Un-logo.jpg' }
} as const;

interface IUN {
    title: string
    link: string
    description: string
    enclosure: string
    guid: string
    pubDate: string
    source: string
}

const rss = new RSSReader<IUN>();
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

    async init (): Promise<UnsafeEmbedBuilder> {
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