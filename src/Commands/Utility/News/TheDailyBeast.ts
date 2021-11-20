import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://feeds.thedailybeast.com/rss/articles',
    main: 'https://www.thedailybeast.com/',
    command: ['dailybeast', 'thedailybeast'],
    author: ['The Daily Beast', 'https://img.thedailybeast.com/image/upload/v1550872986/Whitelr_soctf0.png']
} as const;

interface IDailyBeast {
    title: string
    description: string
    link: string
    guid: string
    category: string
    'dc:creator': string
    pubDate: string
}

const rss = new RSSReader<IDailyBeast>();
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