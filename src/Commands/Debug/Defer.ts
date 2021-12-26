import { Command } from '#khaf/Command';
import { Message } from 'discord.js';

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Delete the message reference and then send a message.'
            ],
            {
                name: 'debug:defer',
                folder: 'Debug',
                args: [0, 0],
                ratelimit: 5
            }
        );
    }

    async init(message: Message) {
        if (message.deletable)
            await message.delete();
        await message.reply({ embeds: [this.Embed.error('If you\'re seeing this, something went wrong...')] });
    }
}