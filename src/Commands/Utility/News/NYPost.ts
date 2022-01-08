import { Command } from '#khaf/Command';
import { RSSReader } from '#khaf/utility/RSS.js';
import { decodeXML } from 'entities';
import { once } from '#khaf/utility/Memoize.js';

const settings = {
    rss: 'https://nypost.com/feed/',
    main: 'https://nypost.com',
    command: ['nypost'],
    author: { name: 'NYPost', iconURL: 'https://i.imgur.com/jLjuU05.png' }
} as const;

interface INYPost {
    title: string
    comments: string
    pubDate: string
    link: string
    'dc:creator': string
    guid: string
    description: string
    'content:encoded': string
    enclosure: string
    'slash:comments': number
    'post-id': number
    'media:thumbnail': string
    'media:content': { 'media:title': string }
}

const rss = new RSSReader<INYPost>();
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
        const state = await cache();

        if (state === null) {
            return this.Embed.error(`Try again in a minute!`);
        }
        
        if (rss.results.size === 0) {
            return this.Embed.error('An unexpected error occurred!');
        }

        const posts = [...rss.results.values()];
        return this.Embed.ok()
            .setDescription(posts
                .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.link})`)
                .join('\n')
                .slice(0, 2048)
            )
            .setAuthor(settings.author);
    }
}