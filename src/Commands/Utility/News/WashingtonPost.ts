import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '../../../lib/Utility/Memoize.js';
import { URLFactory } from '../../../lib/Utility/Valid/URL.js';

const settings = {
    rss: 'http://feeds.washingtonpost.com/rss/world?itid=lk_inline_manual_43',
    main: 'https://washingtonpost.com',
    command: ['washingtonpost', 'thewashingtonpost'],
    author: ['The Washington Post', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/The_Logo_of_The_Washington_Post_Newspaper.svg/1200px-The_Logo_of_The_Washington_Post_Newspaper.svg.png']
} as const;

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
const cache = once(() => rss.cache(settings.rss));

export class kCommand extends Command {
    constructor() {
        super(
            [
                `Get the latest articles from ${settings.main}!`
            ],
            {
                name: settings.command[0],
                folder: 'News',
                args: [0, 0],
                aliases: settings.command.slice(1)
            }
        );
    }

    async init() {
        await cache();
        if (rss.results.size === 0) {
            return this.Embed.fail('An unexpected error occurred!');
        }

        const posts = [...rss.results.values()].map(p => {
            const u = URLFactory(p.link)!;
            p.link = u.toString();
            return p;
        });

        return this.Embed.success()
            .setDescription(posts
                .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.link})`)
                .join('\n')
                .slice(0, 2048)
            )
            .setAuthor(...settings.author);
    }
}