import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Get the content of a message stringified (guild emojis, etc.).',
                '<guildemoji:1294020340213912>', 'testing stuff?'
            ],
            {
                name: 'debug:content',
                folder: 'Debug',
                args: [1]
            }
        );
    }

    async init(message: Message) {
        return message.reply(message.content, {
            embed: this.Embed.success(`\`\`\`${message.content}\`\`\``),
        });
    }
}