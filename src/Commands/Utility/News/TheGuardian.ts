import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://www.theguardian.com/world/rss',
    main: 'https://theguardian.com',
    command: ['guardian', 'theguardian'],
    author: ['The Guardian', 'https://kahoot.com/files/2020/03/guardian-logo-square.jpg']
} as const;

interface ITheGuardian {
    title: string
    link: string
    description: string
    category: string[]
    pubDate: string
    guid: string
    'media:content': { 'media:credit': string }[]
    'dc:creator': string
    'dc:date': string
}

const rss = new RSSReader<ITheGuardian>();
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