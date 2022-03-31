import { Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { once } from '#khaf/utility/Memoize.js';
import { RSSReader } from '#khaf/utility/RSS.js';
import { type UnsafeEmbed } from '@discordjs/builders';
import { decodeXML } from 'entities';

const settings = {
    rss: 'https://rss.politico.com/politics-news.xml',
    main: 'https://politico.com',
    command: ['politico'],
    author: { name: 'Politico', iconURL: 'https://static.politico.com/28/a1/2458979340028e7f25b0361f3674/politico-logo.png' }
} as const;

interface IPolitico {
    title: string
    link: string
    description: string
    pubDate: string
    guid: string
    'media:content': {
        'media:credit': string
        'media:title': string
        'media:thumbnail': string
    }
    'dc:creator': string
    'dc:contributor': string
    'content:encoded': string
}

const rss = new RSSReader<IPolitico>();
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