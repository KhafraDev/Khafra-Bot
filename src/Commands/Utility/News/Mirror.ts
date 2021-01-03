import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface IMirrorCo {
    title: string
    link: string
    guid: string
    description: string
    pubDate: string
    category: string
    'media:thumbnail': string
    enclosure: string
    'media:content': string
    'media:keywords': string
}

const rss = new RSSReader<IMirrorCo>();
rss.cache('http://www.mirror.co.uk/news/world-news/rss.xml');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://www.mirror.co.uk',
                ''
            ],
            {
                name: 'mirror',
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
            .setAuthor('Mirror', 'https://i.imgur.com/wuINM4z.png');
        return message.reply(embed);
    }
}