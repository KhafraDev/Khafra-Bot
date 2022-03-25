import { Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { once } from '#khaf/utility/Memoize.js';
import { RSSReader } from '#khaf/utility/RSS.js';
import { type UnsafeEmbed } from '@discordjs/builders';
import { decodeXML } from 'entities';

const settings = {
    rss: 'https://feeds.nbcnews.com/nbcnews/public/news',
    main: 'https://nbcnews.com',
    command: ['nbc', 'nbcnews'],
    author: { name: 'NBC', iconURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/NBC_logo.svg/1200px-NBC_logo.svg.png' }
} as const;

interface INBC {
    guid: string
    title: string
    dateTimeWritten: string
    pubDate: string
    updateDate: string
    expires: string
    link: string
    description: string
    'media:content': {
        'media:credit': string
        'media:text': string
        'media:description': string
    }[]
    'media:thumbnail': string
}

const rss = new RSSReader<INBC>();
const cache = once(() => rss.cache(settings.rss));

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