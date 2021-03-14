/** Please get mental illness treated! */

import { Command } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { stonewallTransaction, migrateStonewall } from '../../../lib/Migration/Stonewall.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';

interface ITrashHuman {
    title: string
    link: string
    comments: string
    'dc:creator': string
    pubDate: string
    guid: string
    description: string
    'content:encoded': string
    'wfw:commentRss': string
    'slash:comments': number
    'post-id': number
}

interface Comic {
    comic_key: number
    href: string
    link: string
    title: string
}

const rss = new RSSReader<ITrashHuman>(async () => {
    const comics = [...rss.results.values()].map(item => ({
        href: item.link,
        title: decodeXML(item.title),
        link: item['content:encoded'].match(/src="(.*?)"/)[1]
    }));

    await stonewallTransaction(comics);
});
rss.cache('https://stonetoss.com/index.php/comic/feed/');

@RegisterCommand
export class kCommand extends Command {
    middleware = [migrateStonewall];
    constructor() {
        super(
            [
                'Khafra-Bot does not support white supremacists. ' +
                'This command is meant to illustrate the horrible ' +
                '(racist, anti-semitic, and other) views portrayed by Stonewall.'
            ],
            {
                name: 'stonewall',
                folder: 'Trash',
                args: [0, 0],
                aliases: [ 'rockthrow' ]
            }
        );
    }

    async init() {
        const { rows } = await pool.query<Comic>(`
            SELECT * FROM kbStonewall TABLESAMPLE BERNOULLI(20) ORDER BY random() LIMIT 1;
        `);

        return this.Embed.success()
            .setDescription(`
            StoneToss is a Nazi who holds anti-Semitic views that KhafraBot does not support. 
            This command is designed to make fun of right-wingers who hold these crude and trashy beliefs, not to support his reprehensible ideology.
            `)
            .setTitle(rows[0].title)
            .setURL(rows[0].href)
            .setImage(rows[0].link);
    }
}