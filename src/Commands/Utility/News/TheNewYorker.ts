import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://www.newyorker.com/feed/everything',
    main: 'https://www.newyorker.com/',
    command: ['newyorker', 'thenewyorker'],
    author: { name: 'The New Yorker', iconURL: 'https://media.newyorker.com/photos/59096d7d6552fa0be682ff8f/1:1/w_68,c_limit/eustace-400.png' }
} as const;

interface ITheNewYorker {
    title: string
    link: string
    guid: string
    pubDate: string
    'media:content': string
    description: string
    category: string
    'media:keywords': string
    'dc:modified': string
    'dc:publisher': string
    'media:thumbnail': string
}

const rss = new RSSReader<ITheNewYorker>();
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