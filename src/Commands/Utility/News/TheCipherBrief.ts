import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface ICipherBrief {
    title: string
    link: string
    comments: string
    pubDate: string
    'dc:creator': string
    category: string
    guid: string
    description: string
    'wfw:commentRss': string
    'slash:comments': string
}

const rss = new RSSReader<ICipherBrief>();
rss.cache('https://www.thecipherbrief.com/feed');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://thecipherbrief.com',
                ''
            ],
            {
                name: 'thecipherbrief',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'cipherbrief' ]
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
            .setAuthor('The Cipher Brief', 'https://www.thecipherbrief.com/wp-content/uploads/2017/07/cropped-logo-768x228.png');
        return message.reply(embed);
    }
}