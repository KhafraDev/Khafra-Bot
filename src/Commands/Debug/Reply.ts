import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Have the bot reply to the user.',
                ''
            ], 
            {
                name: 'debug:reply',
                folder: 'Debug',
                args: [0, 0]
            }
        );
    }

    async init(message: Message) {
        return message.reply(this.Embed.success(`Hello, ${message.author}!`));
    }
}