import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';
import { URL } from 'url';

interface IWashingtonPost {
    title: string
    link: string
    pubDate: string
    'dc:creator': string
    description: string
    'media:group': string
    guid: string
    'wp:arc_uuid': string
}

const rss = new RSSReader<IWashingtonPost>();
rss.save = 8;
rss.cache('http://feeds.washingtonpost.com/rss/world?itid=lk_inline_manual_43');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://washingtonpost.com',
                ''
            ],
            {
                name: 'washingtonpost',
                folder: 'News',
                args: [0, 0]
            }
        );
    }

    async init(message: Message) {
        if(rss.results.size === 0) {
            return message.reply(this.Embed.fail('An unexpected error occurred!'));
        }

        const posts = [...rss.results.values()].map(p => {
            const u = new URL(p.link);
            u.search = '';
            p.link = u.toString();
            return p;
        });

        const embed = this.Embed.success()
            .setDescription(posts
                .map((p, i) => `[${i+1}] [${decode(p.title)}](${p.link})`)
                .join('\n')
                .slice(0, 2048)
            )
            .setAuthor('The Washington Post', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/The_Logo_of_The_Washington_Post_Newspaper.svg/1200px-The_Logo_of_The_Washington_Post_Newspaper.svg.png');
        return message.reply(embed);
    }
}