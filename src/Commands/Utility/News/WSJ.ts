import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
    main: 'https://wsj.com',
    command: ['wsj', 'wallstreetjournal'],
    author: ['WSJ', 'http://si.wsj.net/img/WSJ_Logo_black_social.gif']
} as const;

interface IWSJ {
    title: string
    link: string
    description: string
    'content:encoded': string
    pubDate: string
    guid: string
    category: string
    'wsj:articletype': string
}

const rss = new RSSReader<IWSJ>();
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