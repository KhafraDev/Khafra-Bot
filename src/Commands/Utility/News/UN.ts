import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';

interface IUN {
    title: string
    link: string
    description: string
    enclosure: string
    guid: string
    pubDate: string
    source: string
}

const rss = new RSSReader<IUN>();
rss.cache('https://news.un.org/feed/subscribe/en/news/all/rss.xml');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://news.un.org/en/'
            ],
            {
                name: 'un',
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
            .setAuthor('UN', 'http://lofrev.net/wp-content/photos/2014/10/Un-logo.jpg');
    }
}