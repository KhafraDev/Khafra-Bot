import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface IPolitico {
    title: string
    link: string
    description: string
    pubDate: string
    guid: string
    'media:content': {
        'media:credit': string
        'media:title': string
        'media:thumbnail': string
    },
    'dc:creator': string
    'dc:contributor': string
    'content:encoded': string
}

const rss = new RSSReader<IPolitico>();
rss.cache('https://rss.politico.com/politics-news.xml');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://politico.com',
                ''
            ],
            {
                name: 'politico',
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
            .setAuthor('Politico', 'https://static.politico.com/28/a1/2458979340028e7f25b0361f3674/politico-logo.png');
        return message.reply(embed);
    }
}