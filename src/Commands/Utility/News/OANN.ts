import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { URL } from 'node:url';
import { RegisterCommand } from '../../../Structures/Decorator.js';

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
rss.cache('https://www.oann.com/feed');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://oann.com'
            ],
            {
                name: 'oann',
                folder: 'News',
                args: [0, 0]
            }
        );
    }

    async init() {
        if (rss.results.size === 0) {
            return this.Embed.fail('An unexpected error occurred!');
        }

        const posts = [...rss.results.values()].map(p => {
            const u = new URL(p.link);
            u.hash = u.search = '';
            p.link = u.toString();
            return p;
        });
        return this.Embed.success()
            .setDescription(posts
                .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.link})`)
                .join('\n')
                .slice(0, 2048)
            )
            .setAuthor('OANN', 'https://d2pggiv3o55wnc.cloudfront.net/oann/wp-content/uploads/2019/10/OANtoplogo.jpg');
    }
}