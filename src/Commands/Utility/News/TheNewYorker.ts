import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';

interface ITheNewYorker {
    title: string
    link: string
    guid: string
    pubDate: string
    'media:content': string
    description: string
    category: string
    'media:keywords': string
    'dc:modified': string
    'dc:publisher': string
    'media:thumbnail': string
}

const rss = new RSSReader<ITheNewYorker>();
rss.cache('https://www.newyorker.com/feed/everything');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://www.newyorker.com'
            ],
            {
                name: 'newyorker',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'thenewyorker' ]
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
            .setAuthor('The New Yorker', 'https://media.newyorker.com/photos/59096d7d6552fa0be682ff8f/1:1/w_68,c_limit/eustace-400.png');
    }
}