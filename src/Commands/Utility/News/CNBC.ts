import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface ICNBC {
    link: string
    title: string
    description: string
    pubDate: string
    category: string
    guid: string
}

const rss = new RSSReader<ICNBC>();
rss.cache('https://www.cnbc.com/id/100727362/device/rss/rss.html');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://www.cnbc.com',
                ''
            ],
            {
                name: 'cnbc',
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
            .setAuthor('CNBC', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/CNBC_logo.svg/1200px-CNBC_logo.svg.png');
        return message.reply(embed);
    }
}