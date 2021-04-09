import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';

interface IEFF {
    title: string
    link: string
    description: string
    pubDate: string
    guid: string
    category: string[]
    'dc:creator': string
    enclosure: string
}

const rss = new RSSReader<IEFF>();
rss.cache('https://www.eff.org/rss/updates.xml');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://eff.org. Donate @ https://supporters.eff.org/donate/join-eff-today!'
            ],
            {
                name: 'eff',
                folder: 'News',
                args: [0, 0],
            }
        );
    }

    async init() {
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
            .setAuthor('EFF', 'https://www.eff.org/files/2018/06/14/eff_monogram-primary-red.png');
    }
}