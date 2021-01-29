import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface IFT {
    title: string
    link: string
    guid: string
    pubDate: string
    description: string
    source: string
}

const rss = new RSSReader<IFT>();
rss.cache('https://news.google.com/rss/search?q=when:24h+allinurl:ft.com&ceid=US:en&hl=en-US&gl=US');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://ft.com',
                ''
            ],
            {
                name: 'ft',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'financialtimes' ]
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
            .setAuthor('FT', 'https://www.ft.com/__origami/service/image/v2/images/raw/ftlogo-v1%3Abrand-ft-logo-square-coloured?source=update-logos&format=png');
        return message.reply(embed);
    }
}