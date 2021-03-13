import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';

interface IHuffPost {
    title: string
    link: string
    description: string
    pubDate: string
    guid: string
    comments: string
    enclosure: string
    'content:encoded': string
}

const rss = new RSSReader<IHuffPost>();
rss.cache('https://www.huffpost.com/section/front-page/feed');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://www.huffpost.com'
            ],
            {
                name: 'huffpost',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'huff' ]
            }
        );
    }

    async init() {
        if (rss.results.size === 0) {
            return this.Embed.fail('An unexpected error occurred!');
        }

        const posts = [...rss.results.values()];
        const embed = this.Embed.success()
            .setDescription(posts
                .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.link})`)
                .join('\n')
                .slice(0, 2048)
            )
            .setAuthor('HuffPost', 'https://img.huffingtonpost.com/asset/58fe7a181c00002600e81721.png');
        return embed;
    }
}