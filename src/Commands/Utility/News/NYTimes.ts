import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    main: 'https://nytimes.com',
    command: ['nytimes'],
    author: ['NYTimes', 'https://i.imgur.com/GmhBcJs.png']
} as const;

interface INYTimes {
    title: string
    link: string
    guid: string
    'atom:link': string
    description: string
    'dc:creator': string
    pubDate: string
    category: string[]
    'media:content': string
    'media:credit': string
    'media:description': string
}

const rss = new RSSReader<INYTimes>();
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