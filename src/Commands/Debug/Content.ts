import { Arguments, Command } from '#khaf/Command';
import { codeBlock, type Embed } from '@khaf/builders';
import { Message } from 'discord.js';

export class kCommand extends Command {
    constructor () {
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

    async init (_message: Message, { content }: Arguments): Promise<Embed> {
        return this.Embed.ok(codeBlock(content));
    }
}