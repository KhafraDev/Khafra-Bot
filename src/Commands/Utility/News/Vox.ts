import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://www.vox.com/rss/index.xml',
    main: 'https://vox.com',
    command: ['vox'],
    author: { name: 'Vox', iconURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Vox_logo.svg/1200px-Vox_logo.svg.png' }
} as const;

interface IVox {
    published: string
    updated: string
    title: string
    content: string
    link: string
    id: string
    author: { name: string }
}

const rss = new RSSReader<IVox>();
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
                .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.id})`)
                .join('\n')
                .slice(0, 2048)
            )
            .setAuthor(settings.author);
    }
}