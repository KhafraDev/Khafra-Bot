import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { once } from '../../../lib/Utility/Memoize.js';

interface ISpaceNews {
    title: string
    link: string
    description: string
    enclosure: string
    guid: string
    pubDate: string
}

const rss = new RSSReader<ISpaceNews>();
const cache = once(() => rss.cache('https://www.space.com/feeds/all'));

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://space.com'
            ],
            {
                name: 'space',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'spacenews' ]
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
            .setAuthor('Space News', 'https://vectorlogoseek.com/wp-content/uploads/2019/05/space-com-vector-logo.png');
    }
}