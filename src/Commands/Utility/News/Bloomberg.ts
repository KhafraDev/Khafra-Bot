import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://news.google.com/rss/search?q=when:24h+allinurl:bloomberg.com&ceid=US:en&hl=en-US&gl=US',
    main: 'https://bloomberg.com',
    command: ['bloomberg'],
    author: { name: 'Bloomberg', iconURL: 'https://i.imgur.com/CsJUHy1.png' }
} as const;

interface IBloomberg {
    title: string
    link: string
    guid: string
    pubDate: string
    description: string
    source: string
}

const rss = new RSSReader<IBloomberg>();
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