import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface IUN {
    title: string
    link: string
    description: string
    enclosure: string
    guid: string
    pubDate: string
    source: string
}

const rss = new RSSReader<IUN>();
rss.cache('https://news.un.org/feed/subscribe/en/news/all/rss.xml');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://news.un.org/en/',
                ''
            ],
            {
                name: 'un',
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
            .setAuthor('UN', 'http://lofrev.net/wp-content/photos/2014/10/Un-logo.jpg');
        return message.reply(embed);
    }
}