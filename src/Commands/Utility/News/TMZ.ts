import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://www.tmz.com/rss.xml',
    main: 'https://tmz.com',
    command: ['tmz'],
    author: { name: 'TMZ', iconURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/TMZLogo.svg/1200px-TMZLogo.svg.png' }
} as const;

interface ITMZ {
    title: string
    link: string
    guid: string
    mobileURL: string
    description: string
    'dc:creator': string
    'dc:date': string
}

const rss = new RSSReader<ITMZ>();
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