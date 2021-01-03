import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface IBBC {
    title: string
    description: string
    link: string
    guid: string
    pubDate: string
}

const rss = new RSSReader<IBBC>();
rss.cache('https://www.bellingcat.com/category/news/feed');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://bellingcat.com',
                ''
            ],
			{
                name: 'bellingcat',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'belling' ]
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
            .setAuthor('Bellingcat', 'https://www.bellingcat.com/app/uploads/2018/04/bellingcat_HP_logo_black.jpg');
        return message.reply(embed);
    }
}