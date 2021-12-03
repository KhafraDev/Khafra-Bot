import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://slate.com/feeds/all.rss',
    main: 'https://slate.com',
    command: ['slate'],
    author: { name: 'Slate', iconURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Slate_new_logo.png/250px-Slate_new_logo.png' }
} as const;

interface ISlate {
    'slate:id': string
    title: string
    link: string
    pubDate: string
    guid: string
    description: string
    'dc:creator': string
    'media:content': {
        'media:credit': string
        'media:description': string
    }
}

const rss = new RSSReader<ISlate>();
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

        const posts = [...rss.results.values()];
        return this.Embed.success()
            .setDescription(posts
                .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.link})`)
                .join('\n')
                .slice(0, 2048)
            )
            .setAuthor(settings.author);
    }
}