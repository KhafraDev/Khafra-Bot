import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';

interface IVice {
    title: string
    link: string
    pubDate: string
    description: string
    'content:encoded': string
    guid: string
    enclosure: string
    'dc:creator': string[]
    category: string[]
}

const rss = new RSSReader<IVice>();
rss.cache('https://www.vice.com/en/rss?locale=en_us');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://vice.com'
            ],
            {
                name: 'vice',
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
        const embed = this.Embed.success()
            .setDescription(posts
                .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.link})`)
                .join('\n')
                .slice(0, 2048)
            )
            .setAuthor('Vice', 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c0/Vice_logo.svg/220px-Vice_logo.svg.png');
        return embed;
    }
}