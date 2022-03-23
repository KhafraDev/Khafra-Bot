import { Command } from '#khaf/Command';
import { Stats } from '#khaf/utility/Stats.js';
import { bold, type UnsafeEmbed } from '@discordjs/builders';
import { Message } from 'discord.js';

export class kCommand extends Command {
    constructor () {
        super([
            'Get global stats for the bot!'
        ], {
            name: 'stats',
            folder: 'Bot',
            args: [0, 0],
            ratelimit: 1
        });
    }

    async init (message: Message): Promise<UnsafeEmbed> {
        const guilds = message.client.guilds.cache;
        const {
            globalCommandsUsed,
            globalMessages
        } = Stats.stats;

        const totalMembers = guilds.map(g => g.memberCount)
            .reduce((a, b) => a + b, 0)
            .toLocaleString();
        const totalGuilds = guilds.size.toLocaleString();

        return this.Embed.ok()
            .setTitle('Bot Statistics')
            .addFields(
                { name: bold('Guilds:'), value: totalGuilds, inline: true },
                { name: bold('Members:'), value: totalMembers, inline: true },
                { name: '\u200b', value: '\u200b', inline: true },
                { name: bold('Total Messages:'), value: globalMessages.toLocaleString(), inline: true },
                { name: bold('Total Commands:'), value: globalCommandsUsed.toLocaleString(), inline: true },
                { name: '\u200b', value: '\u200b', inline: true }
            );
    }
}