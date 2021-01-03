import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface ITheGuardian {
    title: string
    link: string
    description: string
    category: string[]
    pubDate: string
    guid: string
    'media:content': { 'media:credit': string }[]
    'dc:creator': string
    'dc:date': string
}

const rss = new RSSReader<ITheGuardian>();
rss.cache('https://www.theguardian.com/world/rss');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://theguardian.com',
                ''
            ],
            {
                name: 'guardian',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'theguardian' ]
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
            .setAuthor('The Guardian', 'https://kahoot.com/files/2020/03/guardian-logo-square.jpg');
        return message.reply(embed);
    }
}