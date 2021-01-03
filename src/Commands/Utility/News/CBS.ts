import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface IABCNews {
    title: string
    link: string
    description: string
    pubDate: string
    guid: string
}

const rss = new RSSReader<IABCNews>();
rss.cache('https://www.cbsnews.com/latest/rss/world');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://cbsnews.com',
                ''
            ],
            {
                name: 'cbs',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'cbsnews' ]
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
            .setAuthor('CBS', 'https://www.icingsmiles.org/wp-content/uploads/2015/09/CBS-Logo.png');
        return message.reply(embed);
    }
}