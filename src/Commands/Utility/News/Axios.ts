import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://api.axios.com/feed/',
    main: 'https://axios.com',
    command: ['axios'],
    author: { name: 'Axios', iconURL: 'https://eig.org/wp-content/uploads/2017/06/Axios-Logo.png' }
} as const;

interface IAxios {
    title: string
    link: string
    description: string
    'dc:creator': string
    'media:content': string
    'media:thumbnail': string
    category: string[]
    pubDate: string
    guid: string
}

const rss = new RSSReader<IAxios>();
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