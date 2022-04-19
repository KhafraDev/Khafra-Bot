import { Command } from '#khaf/Command';
import { Embed, EmbedUtil } from '#khaf/utility/Constants/Embeds.js';
import { once } from '#khaf/utility/Memoize.js';
import { RSSReader } from '#khaf/utility/RSS.js';
import type { APIEmbed } from 'discord-api-types/v10';
import { decodeXML } from 'entities';

const settings = {
    rss: 'http://rss.cnn.com/rss/cnn_world.rss',
    main: 'https://cnn.com',
    command: ['cnn'],
    author: { name: 'CNN', iconURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/CNN.svg/1200px-CNN.svg.png' }
} as const;

interface ICNN {
    title: string
    description: string
    link: string
    guid: string
    pubDate: string
    'media:group': string
    'feedburner:origLink': string
}

const rss = new RSSReader<ICNN>();
const cache = once(async () => rss.cache(settings.rss));

export class kCommand extends Command {
    constructor () {
        super(
            [
                `Get the latest articles from ${settings.main}!`
            ],
            {
                name: settings.command[0],
                folder: 'News',
                args: [0, 0],
                aliases: settings.command.slice(1)
            }
        );
    }

    async init (): Promise<APIEmbed> {
        const state = await cache();

        if (state === null) {
            return Embed.error('Try again in a minute!');
        }

        if (rss.results.size === 0) {
            return Embed.error('An unexpected error occurred!');
        }

        const posts = [...rss.results.values()];
        const embed = Embed.ok();
        EmbedUtil.setDescription(
            embed, posts
                .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.link})`)
                .join('\n')
                .slice(0, 2048)
        );

        return EmbedUtil.setAuthor(embed, settings.author);
    }
}