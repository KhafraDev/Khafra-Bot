import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface INPR {
    title: string
    description: string
    pubDate: string
    link: string
    guid: string
    'content:encoded': string
    'dc:creator': string
}

const rss = new RSSReader<INPR>();
rss.cache('https://feeds.npr.org/1004/rss.xml');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://npr.org',
                ''
            ],
            {
                name: 'npr',
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
            .setAuthor('NPR', 'https://media.npr.org/assets/img/2019/06/17/nprlogo_rgb_whiteborder_custom-7c06f2837fb5d2e65e44de702968d1fdce0ce748-s800-c85.png');
        return message.reply(embed);
    }
}