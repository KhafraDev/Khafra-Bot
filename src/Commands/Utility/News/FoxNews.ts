import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'http://feeds.foxnews.com/foxnews/world',
    main: 'https://foxnews.com',
    command: ['fox', 'foxnews'],
    author: ['Fox News', 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Fox_News_Channel_logo.png']
} as const;

interface IFoxNews {
    guid: string
    link: string
    'media:group': string
    'media:thumbnail': string
    category: string
    title: string
    description: string
    pubDate: string
    'feedburner:origLink': string
}

const rss = new RSSReader<IFoxNews>();
const cache = once(() => rss.cache(settings.rss));

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