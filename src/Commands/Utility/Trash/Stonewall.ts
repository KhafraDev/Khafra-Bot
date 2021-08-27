/** Please get mental illness treated! */

import { Command, Arguments } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { stonewallTransaction, migrateStonewall } from '../../../lib/Migration/Stonewall.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { decodeXML } from 'entities';
import { URL } from 'url';
import { Message, MessageActionRow } from 'discord.js';
import { once } from '../../../lib/Utility/Memoize.js';
import { cpus } from 'os';
import { asyncQuery } from '../../../Structures/Database/SQLite.js';
import { dontThrow } from '../../../lib/Utility/Don\'tThrow.js';
import { Components, disableAll } from '../../../lib/Utility/Constants/Components.js';

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

@RegisterCommand
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
        if (cpus().length === 1) {
            return this.Embed.fail(`This command will not work on this host! Ask the bot maintainer to upgrade their host!`);
        }

        await cache();
        
        if (args[0] === 'latest' && rss.results.size > 0) {
            const trash = [...rss.results.values()].shift()!;
            const { origin, pathname } = new URL(/src="(.*?)"/.exec(trash['content:encoded'])![1]);

            return this.Embed.success()
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
            `, undefined, args.join(' '));
            
            if (comics[0] === undefined) {
                return this.Embed.fail(`No comics with that query could be found. Omit the query for a random comic!`);
            } else if (comics.length === 1) {
                return this.Embed.success()
                    .setDescription(`
                    KhafraBot and its creator emphatically reject Stonewall and his twisted ideology. 
                    The \`stonewall\` command exists to enable people to laugh at the absurdity of his beliefs and call out his bigoted and hateful ideas.
                    `)
                    .setTitle(comics[0].title)
                    .setURL(comics[0].href)
                    .setImage(comics[0].link);
            }

            let idx = 0;
            const makeEmbed = () => this.Embed.success()
                .setDescription(`
                KhafraBot and its creator emphatically reject Stonewall and his twisted ideology. 
                The \`stonewall\` command exists to enable people to laugh at the absurdity of his beliefs and call out his bigoted and hateful ideas.
                `)
                .setTitle(comics[idx].title)
                .setURL(comics[idx].href)
                .setImage(comics[idx].link);

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
                return this.Embed.fail(`Could not send message.`);
            }

            const c = m.createMessageComponentCollector({
                max: comics.length * 2,
                idle: 30000,
                filter: (interaction) =>
                    interaction.user.id === message.author.id
            });

            c.on('collect', i => {
                if (i.customId === 'deny' || c.total >= comics.length * 2) {
                    return c.stop();
                }

                i.customId === 'approve' ? idx++ : idx--;

                if (idx < 0) idx = comics.length - 1;
                if (idx >= comics.length) idx = 0;

                return void dontThrow(i.update({
                    embeds: [makeEmbed()]
                }));
            });

            c.once('end', (i) => {
                if (i.size === 0 || i.last()!.replied) {
                    return void dontThrow(m.edit({
                        components: disableAll(m)
                    }));
                }

                if (i.last()!.replied) return; 
                
                return void dontThrow(i.last()!.update({
                    components: disableAll(m)
                }));
            });
        } else {
            const { 0: comic } = await asyncQuery<Comic>(`
                SELECT * FROM kbStonewall ORDER BY RANDOM() LIMIT 1;
            `, { get: true });

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
}