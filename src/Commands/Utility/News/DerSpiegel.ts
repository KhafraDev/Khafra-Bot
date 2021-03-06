import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://www.spiegel.de/international/index.rss',
    main: 'https://spiegel.de',
    command: ['derspiegel', 'spiegel'],
    author: ['Der Spiegel', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Logo-der_spiegel.svg/1280px-Logo-der_spiegel.svg.png']
} as const;

interface IABCNews {
    title: string
    link: string
    description: string
    enclosure: string
    guid: string
    pubDate: string
    'content:encoded': string
}

const rss = new RSSReader<IABCNews>();
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