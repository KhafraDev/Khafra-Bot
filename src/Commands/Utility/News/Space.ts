import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface ISpaceNews {
    title: string
    link: string
    description: string
    enclosure: string
    guid: string
    pubDate: string
}

const rss = new RSSReader<ISpaceNews>();
rss.cache('https://www.space.com/feeds/all');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://space.com',
                ''
            ],
            {
                name: 'space',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'spacenews' ]
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
            .setAuthor('Space News', 'https://vectorlogoseek.com/wp-content/uploads/2019/05/space-com-vector-logo.png');
        return message.reply(embed);
    }
}