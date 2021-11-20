import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://www.vice.com/en/rss?locale=en_us',
    main: 'https://vice.com',
    command: ['vice'],
    author: ['Vice', 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c0/Vice_logo.svg/220px-Vice_logo.svg.png']
} as const;

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
const cache = once(() => rss.cache(settings.rss));

export class kCommand extends Command {
    constructor() {
        super(
            [
                `Get the latest articles from ${settings.main}!`
            ],
            {
                name: settings.command[0],
                folder: 'News',
                args: [0, 0],
                aliases: settings.command.slice(1)
            }
        );
    }

    async init() {
        await cache();
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
            .setAuthor(...settings.author);
    }
}