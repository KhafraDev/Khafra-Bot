import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface IESPN {
    title: string
    description: string
    image: string
    link: string
    pubDate: string
    guid: string
}

const rss = new RSSReader<IESPN>();
rss.cache('https://www.espn.com/espn/rss/news');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://espn.com',
                ''
            ],
            {
                name: 'espn',
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
            .setAuthor('ESPN', 'https://logos-download.com/wp-content/uploads/2016/05/ESPN_logo_red_bg.jpg');
        return message.reply(embed);
    }
}