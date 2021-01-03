import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface IBuzzfeed {
    title: string
    description: string
    link: string
    pubDate: string
    guid: string
    'dc:creator': string
}

const rss = new RSSReader<IBuzzfeed>();
rss.cache('https://www.buzzfeed.com/ca/world.xml');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://buzzfeed.com',
                ''
            ],
            {
                name: 'buzzfeed',
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
            .setAuthor('BuzzFeed', 'https://www.buzzfeed.com/obiwan-static/images/about/press-assets/BuzzFeed_News_Logo.png');
        return message.reply(embed);
    }
}