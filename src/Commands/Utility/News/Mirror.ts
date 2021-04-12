import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { once } from '../../../lib/Utility/Memoize.js';

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
const cache = once(() => rss.cache('http://www.mirror.co.uk/news/world-news/rss.xml'));

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://www.mirror.co.uk'
            ],
            {
                name: 'mirror',
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
            .setAuthor('Mirror', 'https://i.imgur.com/wuINM4z.png');
    }
}