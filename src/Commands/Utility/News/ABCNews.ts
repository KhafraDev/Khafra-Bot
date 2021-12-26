import { Command } from '#khaf/Command';
import { RSSReader } from '#khaf/utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '#khaf/utility/Memoize.js';

const settings = {
    rss: 'https://abcnews.go.com/abcnews/internationalheadlines',
    main: 'https://abcnews.go.com',
    command: ['abc', 'abcnews'],
    author: { name: 'ABC News', iconURL: 'https://s.abcnews.com/assets/beta/assets/abcn_images/abcnews_pearl_stacked.png' }
} as const;

interface IABCNews {
    'media:keywords': string
    title: string
    link: string
    guid: string
    pubDate: string
    description: string
    category: string
}

const rss = new RSSReader<IABCNews>();
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
            return this.Embed.error('An unexpected error occurred!');
        }

        const posts = [...rss.results.values()];
        return this.Embed.ok()
            .setDescription(posts
                .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.link})`)
                .join('\n')
                .slice(0, 2048)
            )
            .setAuthor(settings.author);
    }
}