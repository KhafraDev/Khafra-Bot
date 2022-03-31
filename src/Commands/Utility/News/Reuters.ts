import { Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { once } from '#khaf/utility/Memoize.js';
import { RSSReader } from '#khaf/utility/RSS.js';
import { type UnsafeEmbed } from '@discordjs/builders';
import { decodeXML } from 'entities';

const settings = {
    rss: 'https://news.google.com/rss/search?q=when:24h+allinurl:reuters.com&ceid=US:en&hl=en-US&gl=US',
    main: 'https://reuters.com',
    command: ['reuters'],
    author: { name: 'Reuters', iconURL: 'https://static.reuters.com/resources/r/?m=02&d=20171122&t=2&i=1210836860&r=LYNXMPEDAL0X1&w=2048' }
} as const;

interface IReuters {
    title: string
    link: string
    guid: string
    pubDate: string
    description: string
    source: string
}

const rss = new RSSReader<IReuters>();
// https://codarium.substack.com/p/returning-the-killed-rss-of-reuters
const cache = once(async () => rss.cache(settings.rss));

export class kCommand extends Command {
    constructor () {
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

    async init (): Promise<UnsafeEmbed> {
        const state = await cache();

        if (state === null) {
            return Embed.error('Try again in a minute!');
        }

        if (rss.results.size === 0) {
            return Embed.error('An unexpected error occurred!');
        }

        const posts = [...rss.results.values()];
        return Embed.ok()
            .setDescription(posts
                .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.link})`)
                .join('\n')
                .slice(0, 2048)
            )
            .setAuthor(settings.author);
    }
}