import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface IBusinessInsider {
    guid: string
    title: string
    link: string
    pubDate: string
    'dc:creator': string
    description: string
    'media:thumbnail': string
    'media:credit': string
}

const rss = new RSSReader<IBusinessInsider>();
rss.cache('https://www.businessinsider.com/rss?op=1');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://businessinsider.com',
                ''
            ],
            {
                name: 'businessinsider',
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
            .setAuthor('Business Insider', 'https://i.imgur.com/sXMsOj0.png');
        return message.reply(embed);
    }
}