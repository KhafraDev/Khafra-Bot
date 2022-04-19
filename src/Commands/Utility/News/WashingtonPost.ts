import { Command } from '#khaf/Command';
import { Embed, EmbedUtil } from '#khaf/utility/Constants/Embeds.js';
import { once } from '#khaf/utility/Memoize.js';
import { RSSReader } from '#khaf/utility/RSS.js';
import { URLFactory } from '#khaf/utility/Valid/URL.js';
import type { APIEmbed } from 'discord-api-types/v10';
import { decodeXML } from 'entities';

const settings = {
    rss: 'http://feeds.washingtonpost.com/rss/world?itid=lk_inline_manual_43',
    main: 'https://washingtonpost.com',
    command: ['washingtonpost', 'thewashingtonpost'],
    author: { name: 'The Washington Post', iconURL: 'https://i.imgur.com/TRRMCnb.png' }
} as const;

interface IWashingtonPost {
    title: string
    link: string
    pubDate: string
    'dc:creator': string
    description: string
    'media:group': string
    guid: string
    'wp:arc_uuid': string
}

const rss = new RSSReader<IWashingtonPost>();
rss.save = 8;
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

        const posts = [...rss.results.values()].map(p => {
            const u = URLFactory(p.link)!;
            p.link = u.toString();
            return p;
        });

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