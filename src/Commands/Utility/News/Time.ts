import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface ITime {
    title: string
    link: string
    'dc:creator': string
    pubDate: string
    category: string
    guid: string
    description: string
    'post-id': string
    'feedburner:origLink': string
}

const rss = new RSSReader<ITime>();
rss.cache('http://feeds.feedburner.com/time/world');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://time.com',
                ''
            ],
            {
                name: 'time',
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
            .setAuthor('Time', 'https://api.time.com/wp-content/themes/time2014/img/time-logo-og.png');
        return message.reply(embed);
    }
}