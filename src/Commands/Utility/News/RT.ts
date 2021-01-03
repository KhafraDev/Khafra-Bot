import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface IRT {
    title: string
    link: string
    guid: string
    description: string
    'content:encoded': string
    pubDate: string
    'dc:creator': string
}

const rss = new RSSReader<IRT>();
rss.cache('https://www.rt.com/rss/news/');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://www.RT.com',
                ''
            ],
            {
                name: 'rt',
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
            .setAuthor('RT', 'https://i.imgur.com/4kS8mvK.png');
        return message.reply(embed);
    }
}