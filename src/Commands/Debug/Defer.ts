import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
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
        await message.delete();
        await message.reply({ embeds: [this.Embed.fail('If you\'re seeing this, something went wrong...')] });
    }
}