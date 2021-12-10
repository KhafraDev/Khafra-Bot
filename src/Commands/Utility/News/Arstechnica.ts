import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://arstechnica.com/feed/',
    main: 'https://arstechnica.com/',
    command: ['ars', 'arstechnica'],
    author: { name: 'Arstechnica', iconURL: 'https://i.imgur.com/NpeaohK.png' }
} as const;

interface IArstechnica {
    title: string
    link: string
    pubDate: string
    'dc:creator': string
    category: string
    guid: string
    description: string
    'content:encoded': string
}

const rss = new RSSReader<IArstechnica>();
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