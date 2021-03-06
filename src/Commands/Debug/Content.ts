import { Arguments, Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get the content of a message stringified (guild emojis, etc.).',
                '<guildemoji:1294020340213912>', 'testing stuff?'
            ],
            {
                name: 'debug:content',
                folder: 'Debug',
                args: [1],
                ratelimit: 3
            }
        );
    }

    async init(_message: Message, { content }: Arguments) {
        return this.Embed.success(`\`\`\`${content}\`\`\``);
    }
}