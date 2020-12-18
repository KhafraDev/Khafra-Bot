import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { cache, chatarrFetch } from '../../../lib/Backend/Chatarr.js';

await chatarrFetch().catch(() => {});

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch an aggregated list of world news provided by chatarr.com!',
                ''
            ],
			{
                name: 'chatarr',
                folder: 'News',
                args: [0, 0],
                aliases: ['news']
            }
        );
    }

    async init(message: Message) {
        if(!Array.isArray(cache.c) || cache.c.length === 0) {
            await chatarrFetch();
            return message.reply(this.Embed.fail(`
            Failed to fetch articles on start-up.

            This may take up to 5 minutes if no errors persist.
            `));
        }

        return message.reply(this.Embed.success(
            cache.c
            .map((a, i) => `[${i+1}] - [${a.title}](${a.href})`)
            .join('\n')
            .slice(0, 2048)
        ));
    }
}