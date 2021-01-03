import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface ITheNewYorker {
    title: string
    link: string
    guid: string
    pubDate: string
    'media:content': string
    description: string
    category: string
    'media:keywords': string
    'dc:modified': string
    'dc:publisher': string
    'media:thumbnail': string
}

const rss = new RSSReader<ITheNewYorker>();
rss.cache('https://www.huffpost.com/section/front-page/feed');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://www.newyorker.com',
                ''
            ],
            {
                name: 'newyorker',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'thenewyorker' ]
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
            .setAuthor('The New Yorker', 'https://media.newyorker.com/photos/59096d7d6552fa0be682ff8f/1:1/w_68,c_limit/eustace-400.png');
        return message.reply(embed);
    }
}