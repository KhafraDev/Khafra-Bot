import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

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
rss.cache('https://news.google.com/rss/search?q=when:24h+allinurl:reuters.com&ceid=US:en&hl=en-US&gl=US');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://reuters.com',
                ''
            ],
            {
                name: 'reuters',
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
            .setAuthor('Reuters', 'https://static.reuters.com/resources/r/?m=02&d=20171122&t=2&i=1210836860&r=LYNXMPEDAL0X1&w=2048');
        return message.reply(embed);
    }
}