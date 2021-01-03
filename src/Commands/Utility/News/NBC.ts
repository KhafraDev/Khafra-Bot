import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decode } from 'entities';

interface INBC {
    guid: string
    title: string
    dateTimeWritten: string
    pubDate: string
    updateDate: string
    expires: string
    link: string
    description: string
    'media:content': {
        'media:credit': string
        'media:text': string
        'media:description': string
    }[]
    'media:thumbnail': string
}

const rss = new RSSReader<INBC>();
rss.cache('https://feeds.nbcnews.com/nbcnews/public/news');

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://nbcnews.com',
                ''
            ],
            {
                name: 'nbc',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'nbcnews' ]
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
            .setAuthor('NBC', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/NBC_logo.svg/1200px-NBC_logo.svg.png');
        return message.reply(embed);
    }
}