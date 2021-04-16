import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { once } from '../../../lib/Utility/Memoize.js';

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
const cache = once(() => rss.cache('https://deadstate.org/feed/'));

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://deadstate.org/'
            ],
            {
                name: 'deadstate',
                folder: 'News',
                args: [0, 0]
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
            .setAuthor('DeadState', 'https://deadstate.org/wp-content/uploads/2016/01/logo-new.jpg');
    }
}