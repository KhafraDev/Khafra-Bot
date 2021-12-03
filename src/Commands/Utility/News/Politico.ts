import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://rss.politico.com/politics-news.xml',
    main: 'https://politico.com',
    command: ['politico'],
    author: { name: 'Politico', iconURL: 'https://static.politico.com/28/a1/2458979340028e7f25b0361f3674/politico-logo.png' }
} as const;

interface IPolitico {
    title: string
    link: string
    description: string
    pubDate: string
    guid: string
    'media:content': {
        'media:credit': string
        'media:title': string
        'media:thumbnail': string
    },
    'dc:creator': string
    'dc:contributor': string
    'content:encoded': string
}

const rss = new RSSReader<IPolitico>();
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