import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface IBBC {
    title: string
    description: string
    link: string
    guid: string
    pubDate: string
}

const rss = new RSSReader<IBBC>();
rss.cache('http://feeds.bbci.co.uk/news/rss.xml');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://bbc.com',
                ''
            ],
            {
                name: 'bbc',
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
            .setAuthor('BBC News', 'https://download.logo.wine/logo/BBC_News/BBC_News-Logo.wine.png');
        return message.reply(embed);
    }
}