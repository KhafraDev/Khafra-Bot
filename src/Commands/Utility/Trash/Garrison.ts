/** Please get mental illness treated! */

import { Command } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { migrateGarrison } from '../../../lib/Migration/Garrison.js';

/*interface ISchizophrenia {
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
}*/

interface Comic {
    comic_key: number
    href: string
    link: string
    title: string
}

/*const rss = new RSSReader<ISchizophrenia>(async () => {
    const comics = [...rss.results.values()].map(item => ({
        href: item.link,
        title: decodeXML(item.title),
        link: item['content:encoded'].match(/src="(.*?)"/)[1]
    }));

    await garrisonTransaction(comics);
});
rss.cache('https://grrrgraphics.com/feed/');*/

@RegisterCommand
export class kCommand extends Command {
    middleware = [migrateGarrison];
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

    async init() {
        /*if (args[0] === 'latest' && rss.results.size > 0) {
            const comic = [...rss.results.values()].shift();
            return this.Embed.success()
                .setTitle(decodeXML(comic.title))
                .setURL(comic.link)
                .setImage(comic['content:encoded'].match(/src="(.*?)"/)[1]);
        }*/

        const { rows } = await pool.query<Comic>(`
            SELECT * FROM kbGarrison TABLESAMPLE BERNOULLI(20) ORDER BY random() LIMIT 1;
        `);

        return this.Embed.success()
            .setTitle(rows[0].title)
            .setURL(rows[0].href)
            .setImage(rows[0].link);
    }
}