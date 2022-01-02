import { Command, Arguments } from '#khaf/Command';
import { brancoTransaction, migrateBranco } from '#khaf/migration/Branco.js';
import { decodeXML } from 'entities';
import { RSSReader } from '#khaf/utility/RSS.js';
import { Message } from 'discord.js';
import { once } from '#khaf/utility/Memoize.js';
import { asyncQuery } from '#khaf/database/SQLite.js';

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
        link: /src="(.*?)"/.exec(item['content:encoded'])![1]?.replace(/-\d+x\d+\.(.*?)/, '.$1')
    }));

    await brancoTransaction(comics);
});

const cache = once(async () => {
    await migrateBranco();
    await rss.cache('https://comicallyincorrect.com/feed/')
});

export class kCommand extends Command {
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

    async init(_message: Message, { args }: Arguments) {   
        await cache();
        
        if (args[0] === 'latest' && rss.results.size > 0) {
            const comic = [...rss.results.values()].shift()!;
            return this.Embed.ok()
                .setTitle(decodeXML(comic.title))
                .setURL(comic.link)
                .setImage(/src="(.*?)"/.exec(comic['content:encoded'])![1]?.replace(/-\d+x\d+\.(.*?)/, '.$1'));
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