import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface ISkyNews {
    title: string
    link: string
    description: string
    pubDate: string
    guid: string
    enclosure: string
    'media:description': string
    'media:thumbnail': string
    'media:content': string
}

const rss = new RSSReader<ISkyNews>();
rss.cache('http://feeds.skynews.com/feeds/rss/world.xml');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://news.sky.com',
                ''
            ],
            {
                name: 'sky',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'skynews' ]
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
            .setAuthor('Sky News', 'https://news.sky.com/resources/sky-news-logo.png?v=1?bypass-service-worker');
        return message.reply(embed);
    }
}