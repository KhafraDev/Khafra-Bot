import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Have the bot reply to the user.'
            ], 
            {
                name: 'debug:reply',
                folder: 'Debug',
                args: [0, 0],
                ratelimit: 3
            }
        );
    }

    async init(message: Message) {
        return this.Embed.ok(`Hello, ${message.author}!`);
    }
}