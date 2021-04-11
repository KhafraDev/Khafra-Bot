import { Command } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { brancoTransaction, migrateBranco } from '../../../lib/Migration/Branco.js';
import { decodeXML } from 'entities';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { Message } from 'discord.js';

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
        link: item['content:encoded'].match(/src="(.*?)"/)[1]?.replace(/-\d+x\d+\.(.*?)/, '.$1')
    }));

    await brancoTransaction(comics);
});
rss.cache('https://comicallyincorrect.com/feed/');

@RegisterCommand
export class kCommand extends Command {
    middleware = [migrateBranco];
    constructor() {
        super(
            [
                'A.F. Branco Political cartoons.'
            ],
            {
                name: 'branco',
                folder: 'Trash',
                args: [0, 1],
                aliases: [ 'afbranco' ]
            }
        );
    }

    async init(_message: Message, args: string[]) {
        if (args[0] === 'latest' && rss.results.size > 0) {
            const comic = [...rss.results.values()].shift();
            return this.Embed.success()
                .setTitle(decodeXML(comic.title))
                .setURL(comic.link)
                .setImage(comic['content:encoded'].match(/src="(.*?)"/)[1]?.replace(/-\d+x\d+\.(.*?)/, '.$1'));
        }

        const { rows } = await pool.query<Comic>(`
            SELECT * FROM kbBranco TABLESAMPLE BERNOULLI(10) ORDER BY random() LIMIT 1;
        `);

        return this.Embed.success()
            .setTitle(rows[0].title)
            .setURL(rows[0].href)
            .setImage(rows[0].link);
    }
}