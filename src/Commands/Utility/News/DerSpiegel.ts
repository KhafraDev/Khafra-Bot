import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { once } from '../../../lib/Utility/Memoize.js';

interface IABCNews {
    title: string
    link: string
    description: string
    enclosure: string
    guid: string
    pubDate: string
    'content:encoded': string
}

const rss = new RSSReader<IABCNews>();
const cache = once(() => rss.cache('https://www.spiegel.de/international/index.rss'));

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://spiegel.de'
            ],
            {
                name: 'spiegel',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'derspiegel' ]
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
            .setAuthor('Der Spiegel', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Logo-der_spiegel.svg/1280px-Logo-der_spiegel.svg.png');
    }
}