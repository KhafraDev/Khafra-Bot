import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface ITheHill {
    title: string
    link: string
    description: string
    pubDate: string
    'dc:creator': string
    guid: string
}

const rss = new RSSReader<ITheHill>();
rss.cache('http://thehill.com/rss/syndicator/19109');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://thehill.com',
                ''
            ],
            {
                name: 'thehill',
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
            .setAuthor('The Hill', 'https://thehill.com/sites/all/themes/thehill/images/redesign/thehill-logo-big.png');
        return message.reply(embed);
    }
}