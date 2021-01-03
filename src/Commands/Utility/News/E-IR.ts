import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface IEIRinfo {
    title: string
    link: string
    comments: string
    pubDate: string
    'dc:creator': string
    category: string
    guid: string
    description: string
    'wfw:commentRss': string
    'slash:comments': string
}

const rss = new RSSReader<IEIRinfo>();
rss.cache('https://www.e-ir.info/feed/');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://e-ir.info',
                ''
            ],
            {
                name: 'eir',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'e-ir', 'e-irinfo' ]
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
            .setAuthor('E-IR', 'https://www.e-ir.info/wp-content/uploads/2014/01/eir-logo-stack@x2-1.png');
        return message.reply(embed);
    }
}