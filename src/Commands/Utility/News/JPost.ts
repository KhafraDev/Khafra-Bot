import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { once } from '../../../lib/Utility/Memoize.js';

const settings = {
    rss: 'https://www.jpost.com/rss/rssfeedsfrontpage.aspx',
    main: 'https://jpost.com',
    command: ['jpost'],
    author: ['JPost', 'https://images.jpost.com/image/upload/f_auto,fl_lossy/t_JD_ExpertTopPic_1024/268438']
} as const;

interface IJPost {
    title: string
    link: string
    description: string
    Photographer: string
    pubDate: string
    UpdateDate: string
    itemID: string
    isPremium: string
    isVideo: string
    Author: string
    Sponsored: string
    Tags: string
    CategoryID: string
}

const rss = new RSSReader<IJPost>();
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