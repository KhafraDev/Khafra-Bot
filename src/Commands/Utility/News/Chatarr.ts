import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { cache, chatarrFetch } from '../../../lib/Backend/Chatarr.js';

export default class extends Command {
    constructor() {
        super(
            [
                'NYTimes: get the most viewed articles from today.',
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
        if(!cache.c) {
            await chatarrFetch();
            return message.reply(this.Embed.fail(`
            Articles couldn't be fetched, or haven't yet. Please wait a few minutes before attempting to use this command again. :)
            `));
        }

        return message.reply(this.Embed.success(cache.c
            .map(a => `[${a.title}](${a.href}) - ${a.time}`)
            .join('\n')
            .slice(0, 2048)
        ));
    }
}