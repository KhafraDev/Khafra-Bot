import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://www.eff.org/rss/updates.xml',
    main: 'https://eff.org. Donate @ https://supporters.eff.org/donate/join-eff-today',
    command: ['eff'],
    author: { name: 'EFF', iconURL: 'https://www.eff.org/files/2018/06/14/eff_monogram-primary-red.png' }
} as const;

interface IEFF {
    title: string
    link: string
    description: string
    pubDate: string
    guid: string
    category: string[]
    'dc:creator': string
    enclosure: string
}

const rss = new RSSReader<IEFF>();
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
            .setAuthor(settings.author);
    }
}