import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://deadstate.org/feed/',
    main: 'https://deadstate.org/',
    command: ['deadstate'],
    author: { name: 'DeadState', iconURL: 'https://deadstate.org/wp-content/uploads/2016/01/logo-new.jpg' }
} as const;

interface IDeadState {
    title: string
    link: string
    comments: string
    'dc:creator': string
    pubDate: string
    category: string[]
    guid: string
    description: string
    'wfw:commentRss': string
    'slash:comments': number
    'media:thumbnail': string
    'media:content': { 'media:title': string }
}

const rss = new RSSReader<IDeadState>();
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