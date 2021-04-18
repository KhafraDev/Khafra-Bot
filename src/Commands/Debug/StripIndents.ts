import { Arguments, Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { stripIndents } from '../../lib/Utility/Template.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Test the stripIndents function.'
            ],
            {
                name: 'debug:stripindents',
                folder: 'Debug',
                args: [1],
                ratelimit: 3
            }
        );
    }

    async init(_message: Message, { content }: Arguments) {
        return stripIndents`
        \`\`${content.slice(0, 2040)}\`\`
        `;
    }
}