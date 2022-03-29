import { Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { type UnsafeEmbed } from '@discordjs/builders';
import { Message } from 'discord.js';

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Get the number of members in a guild!'
            ],
            {
                name: 'members',
                folder: 'Server',
                args: [0, 0],
                guildOnly: true,
                ratelimit: 3,
                aliases: ['membercount']
            }
        );
    }

    async init (message: Message<true>): Promise<UnsafeEmbed> {
        return Embed.ok(`
        There are **${message.guild.memberCount.toLocaleString()}** members in ${message.guild.name}!
        `);
    }
}