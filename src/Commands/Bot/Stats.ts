import { Message } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { Stats } from '../../lib/Utility/Stats.js';
import { bold } from '@khaf/builders';

export class kCommand extends Command {
    constructor() {
        super([
            'Get global stats for the bot!'
        ], {
            name: 'stats',
            folder: 'Bot',
            args: [0, 0],
            ratelimit: 1
        });
    }

    async init(message: Message) {
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
            .setTitle(`Bot Statistics`)
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