import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';

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

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://nbcnews.com'
            ],
            {
                name: 'nbc',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'nbcnews' ]
            }
        );
    }

    async init() {
        if (rss.results.size === 0) {
            return this.Embed.fail('An unexpected error occurred!');
        }

        const posts = [...rss.results.values()];
        return this.Embed.success()
            .setDescription(posts
                .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.link})`)
                .join('\n')
                .slice(0, 2048)
            )
            .setAuthor('NBC', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/NBC_logo.svg/1200px-NBC_logo.svg.png');
    }
}