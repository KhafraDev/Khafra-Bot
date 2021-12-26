import { Command } from '#khaf/Command';
import { RSSReader } from '#khaf/utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '#khaf/utility/Memoize.js';

const settings = {
    rss: 'https://feeds.feedburner.com/breitbart',
    main: 'https://breitbart.com',
    command: ['breitbart'],
    author: { name: 'Breitbart', iconURL: 'https://i.imgur.com/M734x8J.png' }
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