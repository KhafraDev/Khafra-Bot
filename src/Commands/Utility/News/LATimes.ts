import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';

interface ILATimes {
    title: string
    'dc:creator': string
    pubDate: string
    link: string
    guid: string
    description: string
    'content:encoded': string
    'media:content': {
        'media:description': string
        'media:credit': string
    }
}

const rss = new RSSReader<ILATimes>();
rss.cache('https://www.latimes.com/world/rss2.0.xml');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://www.latimes.com'
            ],
            {
                name: 'latimes',
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
            .setAuthor('LATimes', 'https://cdn.shopify.com/s/files/1/0249/9326/7772/products/logo_grande_grande_a5b034b5-8b86-47bc-af3c-eba114fdea8b_600x.jpg');
        return embed;
    }
}