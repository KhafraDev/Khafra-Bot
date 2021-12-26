import { Command } from '#khaf/Command';
import { RSSReader } from '#khaf/utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '#khaf/utility/Memoize.js';
import { URLFactory } from '../../../lib/Utility/Valid/URL.js';

const settings = {
    rss: 'https://www.oann.com/feed/',
    main: 'https://oann.com',
    command: ['oann'],
    author: { name: 'OANN', iconURL: 'https://d2pggiv3o55wnc.cloudfront.net/oann/wp-content/uploads/2019/10/OANtoplogo.jpg' }
} as const;

interface IOANN {
    title: string
    link: string
    comments: string
    'dc:creator': string
    pubDate: string
    category: string
    guid: string
    description: string
    'wfw:commentRss': string
    'slash:comments': number
}

const rss = new RSSReader<IOANN>();
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

        const posts = [...rss.results.values()].map(p => {
            const u = URLFactory(p.link)!;
            p.link = u.toString();
            return p;
        });
        return this.Embed.ok()
            .setDescription(posts
                .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.link})`)
                .join('\n')
                .slice(0, 2048)
            )
            .setAuthor(settings.author);
    }
}