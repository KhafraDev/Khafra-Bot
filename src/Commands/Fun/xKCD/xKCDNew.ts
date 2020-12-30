import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { fetchNew } from '../../../lib/Backend/xKCD.js';
import { cache } from './xKCD.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Cache new xKCD comics.',
                ''
            ],
			{
                name: 'xkcdnew',
                folder: 'Fun',
                args: [0, 0],
                ownerOnly: true
            }
        );
    }

    async init(message: Message) {
        try {
            await fetchNew();
        } catch(e) {
            return message.reply(this.Embed.fail(`
            An unexpected error occurred.
            ${e.toString()}
            `));
        }

        cache.xkcd = (await import('../../../../assets/xkcd.json')).default;

        return message.reply(this.Embed.success(`
        Updated xKCD cache with new comics (if any new ones were found).
        `));
    }
}