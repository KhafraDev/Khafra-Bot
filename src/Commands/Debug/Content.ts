import { Arguments, Command } from '#khaf/Command';
import { Message } from 'discord.js';
import { codeBlock } from '@khaf/builders';

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
        return this.Embed.ok(codeBlock(content));
    }
}