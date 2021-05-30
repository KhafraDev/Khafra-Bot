import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://feeds.feedburner.com/breitbart',
    main: 'https://breitbart.com',
    command: ['breitbart'],
    author: ['Breitbart', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Breitbart_News.svg/1200px-Breitbart_News.svg.png']
} as const;

interface IBreitbart {
    title: string
    link: string
    'atom:link': string
    comments: string
    pubDate: string
    'dc:creator': string
    author: string
    guid: string
    description: string
    category: string[]
    enclosure: string
    'media:content': {
        'media:title': string
        'media:description': string
        'media:credit': string
    }
    'feedburner:origLink': string
}

const rss = new RSSReader<IBreitbart>();
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