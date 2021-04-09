import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';

interface ISkyNews {
    title: string
    link: string
    description: string
    pubDate: string
    guid: string
    enclosure: string
    'media:description': string
    'media:thumbnail': string
    'media:content': string
}

const rss = new RSSReader<ISkyNews>();
rss.cache('http://feeds.skynews.com/feeds/rss/world.xml');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://news.sky.com'
            ],
            {
                name: 'sky',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'skynews' ]
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
            .setAuthor('Sky News', 'https://news.sky.com/resources/sky-news-logo.png?v=1?bypass-service-worker');
    }
}