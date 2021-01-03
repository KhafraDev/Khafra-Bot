import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface ICNet {
    title: string
    link: string
    guid: string
    pubDate: string
    description: string
    'media:thumbnail': string
    'dc:creator': string
}

const rss = new RSSReader<ICNet>();
rss.cache('https://www.cnet.com/rss/all/');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://cnet.com',
                ''
            ],
            {
                name: 'cnet',
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
            .setAuthor('CNet', 'http://www.ranklogos.com/wp-content/uploads/2012/04/CNET_Logo.jpg');
        return message.reply(embed);
    }
}