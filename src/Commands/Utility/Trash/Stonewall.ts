/** Please get mental illness treated! */

import { Command, Arguments } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { stonewallTransaction, migrateStonewall } from '../../../lib/Migration/Stonewall.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { URL } from 'url';
import { Message } from 'discord.js';
import { once } from '../../../lib/Utility/Memoize.js';
import { cpus } from 'os';
import { asyncQuery } from '../../../Structures/Database/SQLite.js';

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
    const comics = [...rss.results.values()].map(item => {
        const { origin, pathname } = new URL(item['content:encoded'].match(/src="(.*?)"/)[1]);
        return {
            href: item.link,
            title: decodeXML(item.title),
            link: `${origin}${pathname}`
        }
    });

    await stonewallTransaction(comics);
});
const cache = once(async () => {
    await migrateStonewall();
    await rss.cache('https://stonetoss.com/index.php/comic/feed/')
});

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'KhafraBot and its creator emphatically reject Stonewall and his twisted ideology. ' +
                'The \`stonewall\` command exists to enable people to laugh at the absurdity of his beliefs and call out his bigoted, often hateful ideas.'
            ],
            {
                name: 'stonewall',
                folder: 'Trash',
                args: [0, 1],
                aliases: [ 'rockthrow', 'pebble' ]
            }
        );
    }

    async init(_message: Message, { args }: Arguments) {
        if (cpus().length === 1) 
            return this.Embed.fail(`This command will not work on this host! Ask the bot maintainer to change their host!`);
            
        await cache();
        
        if (args[0] === 'latest' && rss.results.size > 0) {
            const trash = [...rss.results.values()].shift();
            const { origin, pathname } = new URL(trash['content:encoded'].match(/src="(.*?)"/)[1]);

            return this.Embed.success()
                .setDescription(`
                KhafraBot and its creator emphatically reject Stonewall and his twisted ideology. 
                The \`stonewall\` command exists to enable people to laugh at the absurdity of his beliefs and call out his bigoted, often hateful ideas.
                `)
                .setTitle(decodeXML(trash.title))
                .setURL(trash.link)
                .setImage(`${origin}${pathname}`);
        }

        const { 0: comic } = await asyncQuery<Comic>(`
            SELECT * FROM kbStonewall ORDER BY RANDOM() LIMIT 1;
        `);

        return this.Embed.success()
            .setDescription(`
            KhafraBot and its creator emphatically reject Stonewall and his twisted ideology. 
            The \`stonewall\` command exists to enable people to laugh at the absurdity of his beliefs and call out his bigoted and hateful ideas.
            `)
            .setTitle(comic.title)
            .setURL(comic.href)
            .setImage(comic.link);
    }
}