import { Command } from '#khaf/Command';
import { once } from '#khaf/utility/Memoize.js';
import { RSSReader } from '#khaf/utility/RSS.js';
import { type Embed } from '@khaf/builders';
import { decodeXML } from 'entities';

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
    constructor () {
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

    async init (): Promise<Embed> {
        const state = await cache();

        if (state === null) {
            return this.Embed.error(`Try again in a minute!`);
        }

        const values = Array.from(rss.results);
        const comic = values[Math.floor(Math.random() * values.length)];

        return this.Embed.ok()
            .setTitle(decodeXML(comic.title))
            .setURL(comic.link)
            .setImage(`${/src="(.*?)"/.exec(comic.description)?.[1]}`);
    }
}