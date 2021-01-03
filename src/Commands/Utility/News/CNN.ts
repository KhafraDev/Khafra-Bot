import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface ICNN {
    title: string
    description: string
    link: string
    guid: string
    pubDate: string
    'media:group': string
    'feedburner:origLink': string
}

const rss = new RSSReader<ICNN>();
rss.cache('http://rss.cnn.com/rss/cnn_world.rss');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://cnn.com',
                ''
            ],
            {
                name: 'cnn',
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
            .setAuthor('CNN', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/CNN.svg/1200px-CNN.svg.png');
        return message.reply(embed);
    }
}