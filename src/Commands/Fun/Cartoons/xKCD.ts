import { Command } from '#khaf/Command';
import { Embed, EmbedUtil } from '#khaf/utility/Constants/Embeds.js';
import { once } from '#khaf/utility/Memoize.js';
import { RSSReader } from '#khaf/utility/RSS.js';
import type { APIEmbed } from 'discord-api-types/v10';
import { decodeXML } from 'entities';

interface IxKCD {
    title: string
    link: string
    description: string
    pubDate: string
    guid: string
}

const rss = new RSSReader<IxKCD>();
const cache = once(async () => rss.cache('https://xkcd.com/rss.xml'));

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

    async init (): Promise<APIEmbed> {
        const state = await cache();

        if (state === null) {
            return Embed.error('Try again in a minute!');
        }

        const values = Array.from(rss.results);
        const comic = values[Math.floor(Math.random() * values.length)];

        const embed = Embed.ok();
        EmbedUtil.setTitle(embed, decodeXML(comic.title));
        EmbedUtil.setURL(embed, comic.link);
        EmbedUtil.setImage(embed, { url: `${/src="(.*?)"/.exec(comic.description)?.[1]}` });

        return embed;
    }
}