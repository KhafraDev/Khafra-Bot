import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://nbc-2.com/category/news/feed/',
    main: 'https://nbc-2.com',
    command: ['nbc2', 'nbc-2'],
    author: ['NBC-2', 'https://pbs.twimg.com/profile_images/1018899598029606912/lomPmdG3_400x400.jpg']
} as const;

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