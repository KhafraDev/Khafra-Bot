import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';

interface IBabylonBee {
    title: string
    link: string
    pubDate: string
    'dc:creator': string
    category: string
    guid: string
    description: string
}

const rss = new RSSReader<IBabylonBee>();
rss.cache('https://babylonbee.com/feed/');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://babylonbee.com'
            ],
            {
                name: 'babylonbee',
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
            .setAuthor('The Babylon Bee', 'https://babylonbee.com/img/card-logo.jpg');
    }
}