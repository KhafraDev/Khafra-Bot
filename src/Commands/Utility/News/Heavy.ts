import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface IHeavy {
    title: string
    link: string
    'dc:creator': string
    pubDate: string
    category: string[]
    guid: string
    description: string
    'post-id': number
    'media:thumbnail': string,
    'media:content': { 'media:title': string }[]
}

const rss = new RSSReader<IHeavy>();
rss.cache('https://heavy.com/feed/');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://heavy.com',
                ''
            ],
            {
                name: 'heavy',
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
            .setAuthor('Heavy', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Heavy.com_Logo_2017.svg/1200px-Heavy.com_Logo_2017.svg.png');
        return message.reply(embed);
    }
}