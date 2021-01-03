import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface IBreitbart {
    title: string
    link: string
    'atom:link': string
    comments: string
    pubDate: string
    'dc:creator': string
    author: string
    guid: string
    description: string
    category: string[]
    enclosure: string
    'media:content': {
        'media:title': string
        'media:description': string
        'media:credit': string
    }
    'feedburner:origLink': string
}

const rss = new RSSReader<IBreitbart>();
rss.cache('https://feeds.feedburner.com/breitbart');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://breitbart.com',
                ''
            ],
            {
                name: 'breitbart',
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
            .setAuthor('Breitbart', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Breitbart_News.svg/1200px-Breitbart_News.svg.png');
        return message.reply(embed);
    }
}