import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';

interface IIndependent {
    title: string
    link: string
    description: string
    pubDate: string
    guid: string
    'media:content': string
    'dc:creator': string
    'dc:date': string
    category: string
}

const rss = new RSSReader<IIndependent>();
rss.cache('https://www.independent.co.uk/news/world/rss');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://independent.co.uk'
            ],
            {
                name: 'independent',
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
        const embed = this.Embed.success()
            .setDescription(posts
                .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.link})`)
                .join('\n')
                .slice(0, 2048)
            )
            .setAuthor('Independent', 'https://www.calculuscapital.com/cms/media/Independent_logo_logotype.png');
        return embed;
    }
}