import { Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { isText } from '#khaf/utility/Discord.js';
import { once } from '#khaf/utility/Memoize.js';
import { RSSReader } from '#khaf/utility/RSS.js';
import { type UnsafeEmbed } from '@discordjs/builders';
import type { Message } from 'discord.js';
import { decodeXML } from 'entities';

interface ICyanideAndHappiness {
    title: string
    link: string
    description: string
    category: string
    guid: string
    pubDate: string
}

const rss = new RSSReader<ICyanideAndHappiness>();
// https://github.com/daniellowtw/explosm-rss
// does the scraping for us, so might as well use until it's no longer available
const cache = once(() => rss.cache('https://explosm-1311.appspot.com/'));

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Get a random comic from Cyanide and Happiness! Possibly NSFW (18+).'
            ],
            {
                name: 'cyanideandhappiness',
                folder: 'Games',
                args: [0, 0],
                ratelimit: 5,
                aliases: ['cah']
            }
        );
    }

    async init (message: Message): Promise<UnsafeEmbed> {
        const state = await cache();

        if (state === null) {
            return Embed.error('Try again in a minute!');
        }

        if (isText(message.channel) && !message.channel.nsfw) {
            return Embed.error('Channel isn\'t marked as NSFW!');
        }

        const values = Array.from(rss.results);
        const comic = values[Math.floor(Math.random() * values.length)];

        return Embed.ok()
            .setTitle(decodeXML(comic.title))
            .setURL(comic.link)
            .setImage(`https:${/src="(.*?)"/.exec(comic.description)?.[1]}`);
    }
}