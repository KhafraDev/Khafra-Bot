import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'http://www.mirror.co.uk/news/world-news/rss.xml',
    main: 'https://www.mirror.co.uk',
    command: ['mirror'],
    author: ['Mirror', 'https://i.imgur.com/wuINM4z.png']
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