import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '../../../lib/Utility/Memoize.js';

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
            .setAuthor(settings.author);
    }
}