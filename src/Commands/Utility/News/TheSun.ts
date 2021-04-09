import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';

interface ITheSun {
    title: string
    link: string
    pubDate: string
    'dc:creator': string
    category: string[]
    guid: string
    description: string
}

const rss = new RSSReader<ITheSun>();
rss.cache('https://www.thesun.co.uk/news/worldnews/feed/');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://www.thesun.co.uk'
            ],
            {
                name: 'thesun',
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
            .setAuthor('The Sun', 'https://upload.wikimedia.org/wikipedia/commons/0/0c/The_sun_logo.jpg');
    }
}