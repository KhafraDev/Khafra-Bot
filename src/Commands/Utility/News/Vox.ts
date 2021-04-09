import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';

interface IVox {
    published: string
    updated: string
    title: string
    content: string
    link: string
    id: string
    author: { name: string }
}

const rss = new RSSReader<IVox>();
rss.cache('https://www.vox.com/rss/index.xml');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://vox.com'
            ],
            {
                name: 'vox',
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
                .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.id})`)
                .join('\n')
                .slice(0, 2048)
            )
            .setAuthor('UN', 'http://lofrev.net/wp-content/photos/2014/10/Un-logo.jpg');
    }
}