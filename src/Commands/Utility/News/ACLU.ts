import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://wp.api.aclu.org/rss',
    main: 'https://aclu.org',
    command: ['aclu'],
    author: ['ACLU', 'https://www.aclu.org/shared/images/favicons/android-chrome-192x192.png']
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