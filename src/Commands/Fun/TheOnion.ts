import { Command } from '../../Structures/Command.js';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { fetch } from '../../Structures/Fetcher.js';
import { RSSReader } from '../../lib/Utility/RSS.js';
import { once } from '../../lib/Utility/Memoize.js';
import { rand } from '../../lib/Utility/Constants/OneLiners.js';

interface ITheOnion {
    title: string
    link: string
    description: string
    category: string[]
    pubDate: string
    guid: number
    'dc:creator': string
}

const rss = new RSSReader<ITheOnion>();
const cache = once(() => rss.cache(`https://www.theonion.com/rss`));

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [ 
                'Read one of the latest articles from The Onion!',
                ''
            ],
			{
                name: 'theonion',
                folder: 'Fun',
                aliases: [ 'onion', 'realnews' ],
                args: [0, 0]
            }
        );
    }

    async init() {
        await cache();

        const i = await rand(rss.results.size);
        const id = [...rss.results][i].guid;

        const j = await fetch(`https://theonion.com/api/core/corepost/getList?id=${id}`).json();

        if (j.data.length === 0)
            return this.Embed.fail(`
            You'll have to read the article on TheOnion this time, sorry!
            https://www.theonion.com/${id}
            `);

        return this.Embed.success()
            .setAuthor(
                decodeXML(j.data[0].headline).slice(0, 256), 
                'https://arc-anglerfish-arc2-prod-tronc.s3.amazonaws.com/public/3ED55FMQGXT2OG4GOBTP64LCYU.JPG',
                j.data[0].permalink
            )
            .setTimestamp(j.data[0].publishTimeMillis)
            .setDescription(j.data[0].plaintext.slice(0, 2048));
    }
}