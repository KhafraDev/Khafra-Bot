import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';

interface IPolitico {
    title: string
    link: string
    description: string
    pubDate: string
    guid: string
    'media:content': {
        'media:credit': string
        'media:title': string
        'media:thumbnail': string
    },
    'dc:creator': string
    'dc:contributor': string
    'content:encoded': string
}

const rss = new RSSReader<IPolitico>();
rss.cache('https://rss.politico.com/politics-news.xml');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://politico.com'
            ],
            {
                name: 'politico',
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
            .setAuthor('Politico', 'https://static.politico.com/28/a1/2458979340028e7f25b0361f3674/politico-logo.png');
    }
}