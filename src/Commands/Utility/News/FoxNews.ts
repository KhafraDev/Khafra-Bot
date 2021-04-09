import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';

interface IFoxNews {
    guid: string
    link: string
    'media:group': string
    'media:thumbnail': string
    category: string
    title: string
    description: string
    pubDate: string
    'feedburner:origLink': string
}

const rss = new RSSReader<IFoxNews>();
rss.cache('http://feeds.foxnews.com/foxnews/world');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://foxnews.com'
            ],
            {
                name: 'fox',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'foxnews' ]
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
            .setAuthor('Fox News', 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Fox_News_Channel_logo.png');
    }
}