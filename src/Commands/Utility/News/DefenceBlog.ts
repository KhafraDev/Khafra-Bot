import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface IDefenceBlog {
    title: string
    link: string
    'dc:creator': string
    pubDate: string
    category: string
    guid: string
    description: string
    'post-id': string
}

const rss = new RSSReader<IDefenceBlog>();
rss.cache('http://defence-blog.com/feed');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://defence-blog.com',
                ''
            ],
            {
                name: 'defenceblog',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'defence-blog' ]
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
            .setAuthor('DefenceBlog', 'https://defence-blog.com/wp-content/uploads/2020/06/logo-big-c-180.png');
        return message.reply(embed);
    }
}