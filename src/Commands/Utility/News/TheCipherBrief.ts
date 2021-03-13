import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';

interface ICipherBrief {
    title: string
    link: string
    comments: string
    pubDate: string
    'dc:creator': string
    category: string
    guid: string
    description: string
    'wfw:commentRss': string
    'slash:comments': string
}

const rss = new RSSReader<ICipherBrief>();
rss.cache('https://www.thecipherbrief.com/feed');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://thecipherbrief.com'
            ],
            {
                name: 'thecipherbrief',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'cipherbrief' ]
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
            .setAuthor('The Cipher Brief', 'https://www.thecipherbrief.com/wp-content/uploads/2017/07/cropped-logo-768x228.png');
        return embed;
    }
}