import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface INYTimes {
    title: string
    link: string
    guid: string
    'atom:link': string
    description: string
    'dc:creator': string
    pubDate: string
    category: string[]
    'media:content': string
    'media:credit': string
    'media:description': string
}

const rss = new RSSReader<INYTimes>();
rss.cache('https://rss.nytimes.com/services/xml/rss/nyt/World.xml');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://nytimes.com',
                ''
            ],
            {
                name: 'nytimes',
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
            .setAuthor('NYTimes', 'https://i.imgur.com/GmhBcJs.png');
        return message.reply(embed);
    }
}