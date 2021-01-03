import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

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
rss.cache('https://nypost.com/feed');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://nypost.com',
                ''
            ],
            {
                name: 'nypost',
                folder: 'News',
                args: [0, 0]
            }
        );
    }

    async init(message: Message) {
        if(rss.results.size === 0) {
            return message.reply(this.Embed.fail('An unexpected error occurred!'));
        }

        const posts = [...rss.results.values()];
        const embed = this.Embed.success()
            .setDescription(posts
                .map((p, i) => `[${i+1}] [${decode(p.title)}](${p.link})`)
                .join('\n')
                .slice(0, 2048)
            )
            .setAuthor('NYPost', 'https://res-3.cloudinary.com/crunchbase-production/image/upload/c_lpad,h_170,w_170,f_auto,b_white,q_auto:eco/v1448593722/ttyq9tw3bynhfx94u7ho.png');
        return message.reply(embed);
    }
}