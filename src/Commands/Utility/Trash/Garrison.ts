/** Please get mental illness treated! */

import { Arguments, Command } from '#khaf/Command';
import { garrisonTransaction, migrateGarrison } from '#khaf/migration/Garrison.js';
import { once } from '#khaf/utility/Memoize.js';
import { Message } from 'discord.js';
import { RSSReader } from '#khaf/utility/RSS.js';
import { decodeXML } from 'entities';
import { asyncQuery } from '#khaf/database/SQLite.js';

interface ISchizophrenia {
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
}

interface Comic {
    comic_key: number
    href: string
    link: string
    title: string
}

const rss = new RSSReader<ISchizophrenia>(async () => {
    const comics = [...rss.results.values()].map(item => ({
        href: item.link,
        title: decodeXML(item.title),
        link: /src="(.*?)"/.exec(item['content:encoded'])![1]
    }));

    await garrisonTransaction(comics);
});
const cache = once(async () => {
    await migrateGarrison();
    await rss.cache('https://grrrgraphics.com/feed/')
});

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Ben Garrison needs professional help.'
            ],
            {
                name: 'bengarrison',
                folder: 'Trash',
                args: [0, 1],
                aliases: [ 'garrison' ]
            }
        );
    }

    async init(_message: Message, { args }: Arguments) {  
        await cache();
        
        if (args[0] === 'latest' && rss.results.size > 0) {
            const comic = [...rss.results.values()].shift()!;
            return this.Embed.ok()
                .setTitle(decodeXML(comic.title))
                .setURL(comic.link)
                .setImage(/src="(.*?)"/.exec(comic['content:encoded'])![1]);
        }

        const { 0: comic } = await asyncQuery<Comic>(`
            SELECT * FROM kbGarrison ORDER BY RANDOM() LIMIT 1;
        `);

        return this.Embed.ok()
            .setTitle(comic.title)
            .setURL(comic.href)
            .setImage(comic.link);
    }
}