import { Command } from '../../../Structures/Command.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../../Structures/Decorator.js';

interface ITimesOfIndia {
    title: string
    description: string
    link: string
    guid: string
    pubDate: string
}

const rss = new RSSReader<ITimesOfIndia>();
rss.cache('https://timesofindia.indiatimes.com/rssfeeds/296589292.cms');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch latest articles from https://timesofindia.indiatimes.com'
            ],
            {
                name: 'timesofindia',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'indiatimes' ]
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
            .setAuthor('Times of India', 'https://lawprofessors.typepad.com/.a/6a00d8341bfae553ef01b8d1594773970c-800wi');
        return embed;
    }
}