import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://www.theverge.com/rss/index.xml',
    main: 'https://www.theverge.com',
    command: ['theverge', 'verge'],
    author: ['The Verge', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/The_Verge_Logo_2016.svg/1024px-The_Verge_Logo_2016.svg.png']
} as const;

interface ITheVerge {
    published: string
    updated: string
    title: string
    content: string
    link: string
    id: string
    author: { name: string }
}

const rss = new RSSReader<ITheVerge>();
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
                .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.id})`) // the verge does not use the link item for the actual link
                .join('\n')
                .slice(0, 2048)
            )
            .setAuthor(...settings.author);
    }
}