import { Command } from '#khaf/Command';
import { once } from '#khaf/utility/Memoize.js';
import { RSSReader } from '#khaf/utility/RSS.js';
import { type Embed } from '@khaf/builders';
import { decodeXML } from 'entities';

const settings = {
    rss: 'http://feeds.skynews.com/feeds/rss/world.xml',
    main: 'https://news.sky.com',
    command: ['sky', 'skynews'],
    author: { name: 'Sky News', iconURL: 'https://news.sky.com/resources/sky-news-logo.png?v=1?bypass-service-worker' }
} as const;

interface ISkyNews {
    title: string
    link: string
    description: string
    pubDate: string
    guid: string
    enclosure: string
    'media:description': string
    'media:thumbnail': string
    'media:content': string
}

const rss = new RSSReader<ISkyNews>();
const cache = once(() => rss.cache(settings.rss));

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

    async init (): Promise<Embed> {
        const state = await cache();

        if (state === null) {
            return this.Embed.error(`Try again in a minute!`);
        }
        
        if (rss.results.size === 0) {
            return this.Embed.error('An unexpected error occurred!');
        }

        const posts = [...rss.results.values()];
        return this.Embed.ok()
            .setDescription(posts
                .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.link})`)
                .join('\n')
                .slice(0, 2048)
            )
            .setAuthor(settings.author);
    }
}