/** Please get mental illness treated! */

import { Arguments, Command } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { garrisonTransaction, migrateGarrison } from '../../../lib/Migration/Garrison.js';
import { once } from '../../../lib/Utility/Memoize.js';
import { Message } from 'discord.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { asyncQuery } from '../../../Structures/Database/SQLite.js';

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

@RegisterCommand
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
            return this.Embed.success()
                .setTitle(decodeXML(comic.title))
                .setURL(comic.link)
                .setImage(/src="(.*?)"/.exec(comic['content:encoded'])![1]);
        }

        const { 0: comic } = await asyncQuery<Comic>(`
            SELECT * FROM kbGarrison ORDER BY RANDOM() LIMIT 1;
        `);

        return this.Embed.success()
            .setTitle(comic.title)
            .setURL(comic.href)
            .setImage(comic.link);
    }
}