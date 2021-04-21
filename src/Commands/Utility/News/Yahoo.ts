import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://www.yahoo.com/news/rss/world',
    main: 'https://www.yahoo.com/news',
    command: ['yahoo', 'yahoonews'],
    author: ['Yahoo! News', 'https://s.yimg.com/os/creatr-uploaded-images/2019-09/7ce28da0-de21-11e9-8ef3-b3d0b3dcfb8b']
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