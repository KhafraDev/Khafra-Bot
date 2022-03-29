import { Arguments, Command } from '#khaf/Command';
import { stripIndents } from '#khaf/utility/Template.js';
import { inlineCode } from '@discordjs/builders';
import { Message } from 'discord.js';

export class kCommand extends Command {
    constructor () {
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

    async init (_message: Message, { content }: Arguments): Promise<string> {
        return stripIndents`
        ${inlineCode(content.slice(0, 2040))}
        `;
    }
}