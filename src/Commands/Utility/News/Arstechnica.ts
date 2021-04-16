import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { once } from '../../../lib/Utility/Memoize.js';

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
const cache = once(() => rss.cache('https://arstechnica.com/rss/'));

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://arstechnica.com'
            ],
            {
                name: 'ars',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'arstechnica' ]
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
            .setAuthor('Arstechnica', 'https://i.imgur.com/NpeaohK.png');
    }
}