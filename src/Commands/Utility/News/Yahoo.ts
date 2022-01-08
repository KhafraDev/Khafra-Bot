import { Command } from '#khaf/Command';
import { RSSReader } from '#khaf/utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '#khaf/utility/Memoize.js';

const settings = {
    rss: 'https://www.yahoo.com/news/rss/world',
    main: 'https://www.yahoo.com/news',
    command: ['yahoo', 'yahoonews'],
    author: { name: 'Yahoo! News', iconURL: 'https://s.yimg.com/os/creatr-uploaded-images/2019-09/7ce28da0-de21-11e9-8ef3-b3d0b3dcfb8b' }
} as const;

interface IYahooNews {
    title: string
    link: string
    pubDate: string
    source: string
    guid: string
}

const rss = new RSSReader<IYahooNews>();
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