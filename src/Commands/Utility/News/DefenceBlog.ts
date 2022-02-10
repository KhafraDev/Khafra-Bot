import { Command } from '#khaf/Command';
import { once } from '#khaf/utility/Memoize.js';
import { RSSReader } from '#khaf/utility/RSS.js';
import { type Embed } from '@khaf/builders';
import { decodeXML } from 'entities';

const settings = {
    rss: 'http://defence-blog.com/feed/',
    main: 'https://defence-blog.com',
    command: ['defenceblog', 'defence-blog'],
    author: { name: 'DefenceBlog', iconURL: 'https://defence-blog.com/wp-content/uploads/2020/06/logo-big-c-180.png' }
} as const;

interface IDefenceBlog {
    title: string
    link: string
    'dc:creator': string
    pubDate: string
    category: string
    guid: string
    description: string
    'post-id': string
}

const rss = new RSSReader<IDefenceBlog>();
const cache = once(() => rss.cache(settings.rss));

export class kCommand extends Command {
    constructor () {
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

    async init (): Promise<Embed> {
        const state = await cache();

        if (state === null) {
            return this.Embed.error(`Try again in a minute!`);
        }
        
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