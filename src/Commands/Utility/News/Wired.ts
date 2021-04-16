import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { once } from '../../../lib/Utility/Memoize.js';

interface IWired {
    title: string
    link: string
    guid: string
    pubDate: string
    'media:content': string
    description: string
    category: string[]
    'media:keywords': string
    'dc:creator': string
    'dc:modified': string
    'dc:publisher': string
    'dc:subject': string
    'media:thumbnail': string
}

const rss = new RSSReader<IWired>();
const cache = once(() => rss.cache('https://www.wired.com/feed/rss'));

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://www.wired.com'
            ],
            {
                name: 'wired',
                folder: 'News',
                args: [0, 0]
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
            .setAuthor('Wired', 'https://www.wired.com/images/logos/wired.png');
    }
}