import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface IAxios {
    title: string
    link: string
    description: string
    'dc:creator': string
    'media:content': string
    'media:thumbnail': string
    category: string[]
    pubDate: string
    guid: string
}

const rss = new RSSReader<IAxios>();
rss.cache('https://api.axios.com/feed/');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://axios.com',
                ''
            ],
            {
                name: 'axios',
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
            .setAuthor('Axios', 'https://eig.org/wp-content/uploads/2017/06/Axios-Logo.png');
        return message.reply(embed);
    }
}