import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface INationalGeographic {
    title: string
    link: string
    guid: string
    pubDate: string
    description: string
    source: string
}

const rss = new RSSReader<INationalGeographic>();
// their official rss feed is not updated very often
rss.cache('https://news.google.com/rss/search?q=when:24h+allinurl:nationalgeographic.com&ceid=US:en&hl=en-US&gl=US');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://nationalgeographic.com',
                ''
            ],
            {
                name: 'nationalgeographic',
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
            .setAuthor('National Geographic', 'https://i.imgur.com/sXMsOj0.png');
        return message.reply(embed);
    }
}