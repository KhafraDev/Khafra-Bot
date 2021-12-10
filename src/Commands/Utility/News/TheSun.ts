import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://www.thesun.co.uk/news/worldnews/feed/',
    main: 'https://www.thesun.co.uk',
    command: ['thesun'],
    author: { name: 'The Sun', iconURL: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/The_sun_logo.jpg' }
} as const;

interface ITheSun {
    title: string
    link: string
    pubDate: string
    'dc:creator': string
    category: string[]
    guid: string
    description: string
}

const rss = new RSSReader<ITheSun>();
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