import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://www.cnbc.com/id/100727362/device/rss/rss.html',
    main: 'https://www.cnbc.com/',
    command: ['cnbc'],
    author: ['CNBC', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/CNBC_logo.svg/1200px-CNBC_logo.svg.png']
} as const;

interface ICNBC {
    link: string
    title: string
    description: string
    pubDate: string
    category: string
    guid: string
}

const rss = new RSSReader<ICNBC>();
const cache = once(() => rss.cache(settings.rss));

@RegisterCommand
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