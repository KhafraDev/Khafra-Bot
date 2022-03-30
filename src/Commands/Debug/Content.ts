import type { Arguments} from '#khaf/Command';
import { Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { codeBlock, type UnsafeEmbed } from '@discordjs/builders';
import type { Message } from 'discord.js';

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

    async init (_message: Message, { content }: Arguments): Promise<UnsafeEmbed> {
        return Embed.ok(codeBlock(content));
    }
}