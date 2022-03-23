import { Arguments, Command } from '#khaf/Command';
import { asyncQuery } from '#khaf/database/SQLite.js';
import { brancoTransaction, migrateBranco } from '#khaf/migration/Branco.js';
import { once } from '#khaf/utility/Memoize.js';
import { RSSReader } from '#khaf/utility/RSS.js';
import { type UnsafeEmbed } from '@discordjs/builders';
import { Message } from 'discord.js';
import { decodeXML } from 'entities';

interface IBranco {
    title: string
    link: string
    comments: string
    'dc:creator': string
    pubDate: string
    category: string[]
    guid: string
    description: string
    'content:encoded': string
    'wfw:commentRss': string
    'slash:comments': number
    enclosure: string
}

interface Comic {
    comic_key: number
    href: string
    link: string
    title: string
}

const rss = new RSSReader<IBranco>(async () => {
    const comics = [...rss.results.values()].map(item => ({
        href: item.link,
        title: decodeXML(item.title),
        link: /src="(.*?)"/.exec(item['content:encoded'])?.[1].replace(/-\d+x\d+\.(.*?)/, '.$1') ?? null
    }));

    await brancoTransaction(comics);
});

const cache = once(async () => {
    await migrateBranco();
    await rss.cache('https://comicallyincorrect.com/feed/')
});

export class kCommand extends Command {
    constructor () {
        super(
            [
                'A.F. Branco Political cartoons.'
            ],
            {
                name: 'branco',
                folder: 'Trash',
                args: [0, 1],
                aliases: ['afbranco']
            }
        );
    }

    async init (_message: Message, { args }: Arguments): Promise<UnsafeEmbed> {
        const state = await cache();

        if (state === null) {
            return this.Embed.error('Try again in a minute!');
        }

        if (args[0] === 'latest' && rss.results.size > 0) {
            const comic = [...rss.results.values()].shift()!;
            const image = /src="(.*?)"/.exec(comic['content:encoded'])?.[1].replace(/-\d+x\d+\.(.*?)/, '.$1') ?? null;
            const embed = this.Embed.ok()
                .setTitle(decodeXML(comic.title))
                .setURL(comic.link);

            if (image) embed.setImage(image);

            return embed;
        }

        const { 0: comic } = await asyncQuery<Comic>(`
            SELECT * FROM kbBranco ORDER BY RANDOM() LIMIT 1;
        `);

        return this.Embed.ok()
            .setTitle(comic.title)
            .setURL(comic.href)
            .setImage(comic.link);
    }
}