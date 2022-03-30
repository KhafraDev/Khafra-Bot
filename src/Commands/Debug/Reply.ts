import { Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { type UnsafeEmbed } from '@discordjs/builders';
import type { Message } from 'discord.js';

export class kCommand extends Command {
    constructor () {
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

    async init (message: Message): Promise<UnsafeEmbed> {
        return Embed.ok(`Hello, ${message.author}!`);
    }
}