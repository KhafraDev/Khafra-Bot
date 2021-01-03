import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface IABCNews {
    title: string
    link: string
    description: string
    enclosure: string
    guid: string
    pubDate: string
    'content:encoded': string
}

const rss = new RSSReader<IABCNews>();
rss.cache('https://www.spiegel.de/international/index.rss');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://spiegel.de',
                ''
            ],
            {
                name: 'spiegel',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'derspiegel' ]
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
            .setAuthor('Der Spiegel', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Logo-der_spiegel.svg/1280px-Logo-der_spiegel.svg.png');
        return message.reply(embed);
    }
}