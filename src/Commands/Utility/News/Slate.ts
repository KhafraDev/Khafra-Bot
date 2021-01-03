import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface ISlate {
    'slate:id': string
    title: string
    link: string
    pubDate: string
    guid: string
    description: string
    'dc:creator': string
    'media:content': {
        'media:credit': string
        'media:description': string
    }
}

const rss = new RSSReader<ISlate>();
rss.cache('https://www.slate.com/articles.fulltext.all.10.rss');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://slate.com',
                ''
            ],
            {
                name: 'slate',
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
            .setAuthor('Slate', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Slate_new_logo.png/250px-Slate_new_logo.png');
        return message.reply(embed);
    }
}