import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface IFoxNews {
    guid: string
    link: string
    'media:group': string
    'media:thumbnail': string
    category: string
    title: string
    description: string
    pubDate: string
    'feedburner:origLink': string
}

const rss = new RSSReader<IFoxNews>();
rss.cache('http://feeds.foxnews.com/foxnews/world');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://foxnews.com',
                ''
            ],
            {
                name: 'fox',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'foxnews' ]
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
            .setAuthor('Fox News', 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Fox_News_Channel_logo.png');
        return message.reply(embed);
    }
}