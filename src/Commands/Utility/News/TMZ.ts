import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface ITMZ {
    title: string
    link: string
    guid: string
    mobileURL: string
    description: string
    'dc:creator': string
    'dc:date': string
}

const rss = new RSSReader<ITMZ>();
rss.cache('https://www.tmz.com/rss.xml');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://tmz.com',
                ''
            ],
            {
                name: 'tmz',
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
            .setAuthor('TMZ', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/TMZLogo.svg/1200px-TMZLogo.svg.png');
        return message.reply(embed);
    }
}