import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';

interface IBBC {
    title: string
    description: string
    link: string
    guid: string
    pubDate: string
}

const rss = new RSSReader<IBBC>();
rss.cache('https://www.bellingcat.com/category/news/feed');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://bellingcat.com'
            ],
			{
                name: 'bellingcat',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'belling' ]
            }
        );
    }

    async init() {
        if (rss.results.size === 0) {
            return this.Embed.fail('An unexpected error occurred!');
        }

        const posts = [...rss.results.values()];
        const embed = this.Embed.success()
            .setDescription(posts
                .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.link})`)
                .join('\n')
                .slice(0, 2048)
            )
            .setAuthor('Bellingcat', 'https://www.bellingcat.com/app/uploads/2018/04/bellingcat_HP_logo_black.jpg');
        return embed;
    }
}