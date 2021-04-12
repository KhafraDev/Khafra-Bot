import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { once } from '../../../lib/Utility/Memoize.js';

interface IABCNews {
    'media:keywords': string
    title: string
    link: string
    guid: string
    pubDate: string
    description: string
    category: string
}

const rss = new RSSReader<IABCNews>();
const cache = once(() => rss.cache('https://abcnews.go.com/abcnews/internationalheadlines'));

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://abcnews.go.com'
            ],
            {
                name: 'abc',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'abcnews' ]
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
            .setAuthor('ABC News', 'https://s.abcnews.com/assets/beta/assets/abcn_images/abcnews_pearl_stacked.png');
    }
}