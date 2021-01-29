import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';
import { URL } from 'url';

interface IOANN {
    title: string
    link: string
    comments: string
    'dc:creator': string
    pubDate: string
    category: string
    guid: string
    description: string
    'wfw:commentRss': string
    'slash:comments': number
}

const rss = new RSSReader<IOANN>();
rss.cache('https://feeds.feedburner.com/breitbart');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://oann.com',
                ''
            ],
            {
                name: 'oann',
                folder: 'News',
                args: [0, 0]
            }
        );
    }

    async init(message: Message) {
        if(rss.results.size === 0) {
            return message.reply(this.Embed.fail('An unexpected error occurred!'));
        }

        const posts = [...rss.results.values()].map(p => {
            const u = new URL(p.link);
            u.hash = u.search = '';
            p.link = u.toString();
            return p;
        });
        const embed = this.Embed.success()
            .setDescription(posts
                .map((p, i) => `[${i+1}] [${decode(p.title)}](${p.link})`)
                .join('\n')
                .slice(0, 2048)
            )
            .setAuthor('OANN', 'https://d2pggiv3o55wnc.cloudfront.net/oann/wp-content/uploads/2019/10/OANtoplogo.jpg');
        return message.reply(embed);
    }
}