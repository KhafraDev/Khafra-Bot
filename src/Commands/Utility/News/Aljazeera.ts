import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface IAljazeera {
    link: string
    title: string
    description: string
    pubDate: string
    category: string
    guid: string
}

const rss = new RSSReader<IAljazeera>();
rss.cache('http://www.aljazeera.com/xml/rss/all.xml');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://aljazeera.com',
                ''
            ],
            {
                name: 'aljazeera',
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
            .setAuthor('Aljazeera', 'https://i.imgur.com/I1X7ygr.png');
        return message.reply(embed);
    }
}