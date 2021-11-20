import { decodeXML } from 'entities';
import { once } from '../../../lib/Utility/Memoize.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { Command } from '../../../Structures/Command.js';

interface IxKCD {
    title: string
    link: string
    description: string
    pubDate: string
    guid: string
}

const rss = new RSSReader<IxKCD>();
const cache = once(() => rss.cache('https://xkcd.com/rss.xml'));

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get a random comic from xKCD!'
            ],
			{
                name: 'xkcd',
                folder: 'Games',
                args: [0, 0],
                ratelimit: 5
            }
        );
    }

    async init() {
        await cache();

        const values = Array.from(rss.results);
        const comic = values[Math.floor(Math.random() * values.length)];

        return this.Embed.success()
            .setTitle(decodeXML(comic.title))
            .setURL(comic.link)
            .setImage(`${/src="(.*?)"/.exec(comic.description)?.[1]}`);
    }
}