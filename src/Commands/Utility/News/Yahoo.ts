import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface IYahooNews {
    title: string
    link: string
    pubDate: string
    source: string
    guid: string
}

const rss = new RSSReader<IYahooNews>();
rss.cache('https://www.yahoo.com/news/rss/world');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://www.yahoo.com/news',
                ''
            ],
            {
                name: 'yahoo',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'yahoonews' ]
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
            .setAuthor('Yahoo! News', 'https://s.yimg.com/os/creatr-uploaded-images/2019-09/7ce28da0-de21-11e9-8ef3-b3d0b3dcfb8b');
        return message.reply(embed);
    }
}