import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';

interface ICNet {
    title: string
    link: string
    guid: string
    pubDate: string
    description: string
    'media:thumbnail': string
    'dc:creator': string
}

const rss = new RSSReader<ICNet>();
rss.cache('https://www.cnet.com/rss/all/');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://cnet.com'
            ],
            {
                name: 'cnet',
                folder: 'News',
                args: [0, 0]
            }
        );
    }

    async init() {
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
            .setAuthor('CNet', 'http://www.ranklogos.com/wp-content/uploads/2012/04/CNET_Logo.jpg');
    }
}