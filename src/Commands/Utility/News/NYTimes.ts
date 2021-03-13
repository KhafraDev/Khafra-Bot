import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';

interface INYTimes {
    title: string
    link: string
    guid: string
    'atom:link': string
    description: string
    'dc:creator': string
    pubDate: string
    category: string[]
    'media:content': string
    'media:credit': string
    'media:description': string
}

const rss = new RSSReader<INYTimes>();
rss.cache('https://rss.nytimes.com/services/xml/rss/nyt/World.xml');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://nytimes.com'
            ],
            {
                name: 'nytimes',
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
            .setAuthor('NYTimes', 'https://i.imgur.com/GmhBcJs.png');
        return embed;
    }
}