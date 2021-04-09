import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { URL } from 'node:url';
import { RegisterCommand } from '../../../Structures/Decorator.js';

interface IWashingtonPost {
    title: string
    link: string
    pubDate: string
    'dc:creator': string
    description: string
    'media:group': string
    guid: string
    'wp:arc_uuid': string
}

const rss = new RSSReader<IWashingtonPost>();
rss.save = 8;
rss.cache('http://feeds.washingtonpost.com/rss/world?itid=lk_inline_manual_43');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://washingtonpost.com'
            ],
            {
                name: 'washingtonpost',
                folder: 'News',
                args: [0, 0]
            }
        );
    }

    async init() {
        if (rss.results.size === 0) {
            return this.Embed.fail('An unexpected error occurred!');
        }

        const posts = [...rss.results.values()].map(p => {
            const u = new URL(p.link);
            u.search = '';
            p.link = u.toString();
            return p;
        });

        return this.Embed.success()
            .setDescription(posts
                .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.link})`)
                .join('\n')
                .slice(0, 2048)
            )
            .setAuthor('The Washington Post', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/The_Logo_of_The_Washington_Post_Newspaper.svg/1200px-The_Logo_of_The_Washington_Post_Newspaper.svg.png');
    }
}