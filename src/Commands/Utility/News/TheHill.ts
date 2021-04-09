import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';

interface ITheHill {
    title: string
    link: string
    description: string
    pubDate: string
    'dc:creator': string
    guid: string
}

const rss = new RSSReader<ITheHill>();
rss.cache('http://thehill.com/rss/syndicator/19109');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://thehill.com'
            ],
            {
                name: 'thehill',
                folder: 'News',
                args: [0, 0]
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
            .setAuthor('The Hill', 'https://thehill.com/sites/all/themes/thehill/images/redesign/thehill-logo-big.png');
    }
}