import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface IJPost {
    title: string
    link: string
    description: string
    Photographer: string
    pubDate: string
    UpdateDate: string
    itemID: string
    isPremium: string
    isVideo: string
    Author: string
    Sponsored: string
    Tags: string
    CategoryID: string
}

const rss = new RSSReader<IJPost>();
rss.cache('https://www.jpost.com/rss/rssfeedsfrontpage.aspx');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://jpost.com',
                ''
            ],
            {
                name: 'jpost',
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
            .setAuthor('JPost', 'https://images.jpost.com/image/upload/f_auto,fl_lossy/t_JD_ExpertTopPic_1024/268438');
        return message.reply(embed);
    }
}