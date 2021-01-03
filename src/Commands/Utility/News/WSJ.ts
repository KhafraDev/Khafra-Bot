import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface IWSJ {
    title: string
    link: string
    description: string
    'content:encoded': string
    pubDate: string
    guid: string
    category: string
    'wsj:articletype': string
}

const rss = new RSSReader<IWSJ>();
rss.cache('https://feeds.a.dj.com/rss/RSSWorldNews.xml');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://wsj.com',
                ''
            ],
            {
                name: 'wsj',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'wallstreetjournal' ]
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
            .setAuthor('WSJ', 'http://si.wsj.net/img/WSJ_Logo_black_social.gif');
        return message.reply(embed);
    }
}