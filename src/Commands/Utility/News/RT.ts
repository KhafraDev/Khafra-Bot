import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';

interface IRT {
    title: string
    link: string
    guid: string
    description: string
    'content:encoded': string
    pubDate: string
    'dc:creator': string
}

const rss = new RSSReader<IRT>();
rss.cache('https://www.rt.com/rss/news/');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://www.RT.com'
            ],
            {
                name: 'rt',
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
            .setAuthor('RT', 'https://i.imgur.com/4kS8mvK.png');
    }
}