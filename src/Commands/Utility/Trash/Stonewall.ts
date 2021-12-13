/** Please get mental illness treated! */

import { Command, Arguments } from '../../../Structures/Command.js';
import { stonewallTransaction, migrateStonewall } from '../../../lib/Migration/Stonewall.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { URL } from 'url';
import { Message, MessageActionRow } from 'discord.js';
import { once } from '../../../lib/Utility/Memoize.js';
import { asyncQuery } from '../../../Structures/Database/SQLite.js';
import { dontThrow } from '../../../lib/Utility/Don\'tThrow.js';
import { Components } from '../../../lib/Utility/Constants/Components.js';
import { Paginate } from '../../../lib/Utility/Discord/Paginate.js';

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
        const { origin, pathname } = new URL(/src="(.*?)"/.exec(item['content:encoded'])![1]);
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
    await rss.cache('http://stonetoss.com/comic/feed/');
});

export class kCommand extends Command {
    constructor() {
        super(
            [
                'KhafraBot and its creator emphatically reject Stonewall and his twisted ideology. ' +
                'The `stonewall` command exists to enable people to laugh at the absurdity of his beliefs and call out his bigoted, often hateful ideas.'
            ],
            {
                name: 'stonewall',
                folder: 'Trash',
                args: [0],
                aliases: [ 'rockthrow', 'pebble' ]
            }
        );
    }

    async init(message: Message, { args }: Arguments) {
        await cache();
        
        if (args[0] === 'latest' && rss.results.size > 0) {
            const trash = [...rss.results.values()].shift()!;
            const { origin, pathname } = new URL(/src="(.*?)"/.exec(trash['content:encoded'])![1]);

            return this.Embed.ok()
                .setDescription(`
                KhafraBot and its creator emphatically reject Stonewall and his twisted ideology. 
                The \`stonewall\` command exists to enable people to laugh at the absurdity of his beliefs and call out his bigoted, often hateful ideas.
                `)
                .setTitle(decodeXML(trash.title))
                .setURL(trash.link)
                .setImage(`${origin}${pathname}`);
        } else if (args.length !== 0) {
            const comics = await asyncQuery<Comic>(`
                SELECT * FROM kbStonewall WHERE instr(lower(title), lower(?)) > 0 ORDER BY comic_key DESC LIMIT 5;
            `, args.join(' '));
            
            if (comics[0] === undefined) {
                return this.Embed.error(`No comics with that query could be found. Omit the query for a random comic!`);
            } else if (comics.length === 1) {
                return this.Embed.ok()
                    .setDescription(`
                    KhafraBot and its creator emphatically reject Stonewall and his twisted ideology. 
                    The \`stonewall\` command exists to enable people to laugh at the absurdity of his beliefs and call out his bigoted and hateful ideas.
                    `)
                    .setTitle(comics[0].title)
                    .setURL(comics[0].href)
                    .setImage(comics[0].link);
            }

            const makeEmbed = (page = 0) => this.Embed.ok()
                .setDescription(`
                KhafraBot and its creator emphatically reject Stonewall and his twisted ideology. 
                The \`stonewall\` command exists to enable people to laugh at the absurdity of his beliefs and call out his bigoted and hateful ideas.
                `)
                .setTitle(comics[page].title)
                .setURL(comics[page].href)
                .setImage(comics[page].link);

            const [err, m] = await dontThrow(message.reply({
                embeds: [makeEmbed()],
                components: [
                    new MessageActionRow().addComponents(
                        Components.approve('Next'),
                        Components.secondary('Back'),
                        Components.deny('Stop')
                    )
                ]
            }));

            if (err !== null) {
                return this.Embed.error(`Could not send message.`);
            }

            const c = m.createMessageComponentCollector({
                max: comics.length * 2,
                idle: 30000,
                filter: (interaction) =>
                    interaction.user.id === message.author.id
            });

            return Paginate(c, m, comics.length * 2, makeEmbed);
        } else {
            const { 0: comic } = await asyncQuery<Comic>(`
                SELECT * FROM kbStonewall ORDER BY RANDOM() LIMIT 1;
            `);

            return this.Embed.ok()
                .setDescription(`
                KhafraBot and its creator emphatically reject Stonewall and his twisted ideology. 
                The \`stonewall\` command exists to enable people to laugh at the absurdity of his beliefs and call out his bigoted and hateful ideas.
                `)
                .setTitle(comic.title)
                .setURL(comic.href)
                .setImage(comic.link);
        }
    }
}