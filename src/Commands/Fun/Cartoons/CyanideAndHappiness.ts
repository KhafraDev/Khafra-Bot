import { Message } from 'discord.js';
import { decodeXML } from 'entities';
import { cahTransaction, migrateCAH } from '../../../lib/Migration/CyanideAndHappiness.js';
import { isText } from '../../../lib/types/Discord.js.js';
import { once } from '../../../lib/Utility/Memoize.js';
import { RSSReader } from '../../../lib/Utility/RSS.js';
import { Command } from '../../../Structures/Command.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

interface ICyanideAndHappiness {
    title: string
    link: string
    description: string
    category: string
    guid: string
    pubDate: string
}

interface Comic {
    comic_key: number
    href: string
    link: string
    title: string
}

const rss = new RSSReader<ICyanideAndHappiness>(async () => {
    const comics = [...rss.results.values()].map(item => ({
        href: item.link,
        title: decodeXML(item.title),
        link: `https:${item.description.match(/src="(.*?)"/)[1]}`
    }));

    await cahTransaction(comics);
});
// https://github.com/daniellowtw/explosm-rss
// does the scraping for us, so might as well use until it's no longer available
const cache = once(async () => {
    await migrateCAH();
    await rss.cache('https://explosm-1311.appspot.com/');
});

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get a random comic from Cyanide and Happiness! Possibly NSFW (18+).'
            ],
			{
                name: 'cyanideandhappiness',
                folder: 'Games',
                args: [0, 0],
                ratelimit: 5,
                aliases: ['cah']
            }
        );
    }

    async init(message: Message) {
        await cache();
        
        if (isText(message.channel) && !message.channel.nsfw) {
            return this.Embed.fail('Channel isn\'t marked as NSFW!');
        }

        const { rows } = await pool.query<Comic>(`
            SELECT * FROM kbCAH TABLESAMPLE BERNOULLI(1) ORDER BY random() LIMIT 1;
        `);

        return this.Embed.success()
            .setTitle(rows[0].title)
            .setURL(rows[0].href)
            .setImage(rows[0].link);
    }
}