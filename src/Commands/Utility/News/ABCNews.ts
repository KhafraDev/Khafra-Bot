import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface IABCNews {
    'media:keywords': string
    title: string
    link: string
    guid: string
    pubDate: string
    description: string
    category: string
}

const rss = new RSSReader<IABCNews>();
rss.cache('https://abcnews.go.com/abcnews/internationalheadlines');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://abcnews.go.com',
                ''
            ],
            {
                name: 'abc',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'abcnews' ]
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
            .setAuthor('ABC News', 'https://s.abcnews.com/assets/beta/assets/abcn_images/abcnews_pearl_stacked.png');
        return message.reply(embed);
    }
}