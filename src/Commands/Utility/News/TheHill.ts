import { Command } from '#khaf/Command';
import { RSSReader } from '#khaf/utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '#khaf/utility/Memoize.js';

const settings = {
    rss: 'https://thehill.com/rss/syndicator/19109',
    main: 'https://thehill.com',
    command: ['thehill'],
    author: { name: 'The Hill', iconURL: 'https://thehill.com/sites/all/themes/thehill/images/redesign/thehill-logo-big.png' }
} as const;

interface ITheHill {
    title: string
    link: string
    description: string
    pubDate: string
    'dc:creator': string
    guid: string
}

const rss = new RSSReader<ITheHill>();
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