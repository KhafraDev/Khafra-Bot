import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';

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

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://tmz.com'
            ],
            {
                name: 'tmz',
                folder: 'News',
                args: [0, 0]
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
            .setAuthor('TMZ', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/TMZLogo.svg/1200px-TMZLogo.svg.png');
        return embed;
    }
}