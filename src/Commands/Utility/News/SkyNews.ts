import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'http://feeds.skynews.com/feeds/rss/world.xml',
    main: 'https://news.sky.com',
    command: ['sky', 'skynews'],
    author: ['Sky News', 'https://news.sky.com/resources/sky-news-logo.png?v=1?bypass-service-worker']
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

@RegisterCommand
export class kCommand extends Command {
    constructor() {
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

    async init() {
        await cache();
        if (rss.results.size === 0) {
            return this.Embed.fail('An unexpected error occurred!');
        }

        const posts = [...rss.results.values()];
        return this.Embed.success()
            .setDescription(posts
                .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.link})`)
                .join('\n')
                .slice(0, 2048)
            )
            .setAuthor(...settings.author);
    }
}