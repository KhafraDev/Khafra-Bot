import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://www.e-ir.info/feed/',
    main: 'https://e-ir.info',
    command: ['eir', 'e-ir'],
    author: ['EIR', 'https://www.e-ir.info/wp-content/uploads/2014/01/eir-logo-stack@x2-1.png']
} as const;

interface IEIRinfo {
    title: string
    link: string
    comments: string
    pubDate: string
    'dc:creator': string
    category: string
    guid: string
    description: string
    'wfw:commentRss': string
    'slash:comments': string
}

const rss = new RSSReader<IEIRinfo>();
const cache = once(() => rss.cache(settings.rss));

@RegisterCommand
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
            .setAuthor(...settings.author);
    }
}