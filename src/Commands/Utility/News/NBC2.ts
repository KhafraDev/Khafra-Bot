import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';

interface INBC {
    title: string
    link: string
    'dc:creator': string
    pubDate: string
    category: string[]
    guid: string
    description: string
    'post-id': string
}

const rss = new RSSReader<INBC>();
rss.cache('https://nbc-2.com/category/news/feed');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://nbc-2.com'
            ],
            {
                name: 'nbc-2',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'nbc2' ]
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
            .setAuthor('NBC-2', 'https://pbs.twimg.com/profile_images/1018899598029606912/lomPmdG3_400x400.jpg');
    }
}