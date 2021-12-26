import { Command } from '#khaf/Command';
import { RSSReader } from '#khaf/utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '#khaf/utility/Memoize.js';

const settings = {
    rss: 'https://wp.api.aclu.org/feed/',
    main: 'https://aclu.org',
    command: ['aclu'],
    author: { name: 'ACLU', iconURL: 'https://www.aclu.org/shared/images/favicons/android-chrome-192x192.png' }
} as const;

interface IACLU {
    title: string
    link: string
    'dc:creator': string
    pubDate: 'Thu, 24 Jun 2021 16:02:00 +0000'
    category: string[]
    guid: string
    description: string
    'content:encoded': string
}

const rss = new RSSReader<IACLU>();
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