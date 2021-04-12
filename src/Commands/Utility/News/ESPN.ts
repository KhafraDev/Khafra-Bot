import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { once } from '../../../lib/Utility/Memoize.js';

interface IESPN {
    title: string
    description: string
    image: string
    link: string
    pubDate: string
    guid: string
}

const rss = new RSSReader<IESPN>();
const cache = once(() => rss.cache('https://www.espn.com/espn/rss/news'));

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://espn.com'
            ],
            {
                name: 'espn',
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
            .setAuthor('ESPN', 'https://logos-download.com/wp-content/uploads/2016/05/ESPN_logo_red_bg.jpg');
    }
}