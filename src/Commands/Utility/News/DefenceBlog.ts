import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';

interface IDefenceBlog {
    title: string
    link: string
    'dc:creator': string
    pubDate: string
    category: string
    guid: string
    description: string
    'post-id': string
}

const rss = new RSSReader<IDefenceBlog>();
rss.cache('http://defence-blog.com/feed');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://defence-blog.com'
            ],
            {
                name: 'defenceblog',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'defence-blog' ]
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
            .setAuthor('DefenceBlog', 'https://defence-blog.com/wp-content/uploads/2020/06/logo-big-c-180.png');
    }
}