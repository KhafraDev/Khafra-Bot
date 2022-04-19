import { Command } from '#khaf/Command';
import { Embed, EmbedUtil } from '#khaf/utility/Constants/Embeds.js';
import { Stats } from '#khaf/utility/Stats.js';
import { bold } from '@discordjs/builders';
import type { APIEmbed } from 'discord-api-types/v10';
import type { Message } from 'discord.js';

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

    async init (message: Message): Promise<APIEmbed> {
        const guilds = message.client.guilds.cache;
        const {
            globalCommandsUsed,
            globalMessages
        } = Stats.stats;

        const totalMembers = guilds.map(g => g.memberCount)
            .reduce((a, b) => a + b, 0)
            .toLocaleString();
        const totalGuilds = guilds.size.toLocaleString();

        const embed = Embed.ok();
        EmbedUtil.setTitle(embed, 'Bot Statistics');
        EmbedUtil.addFields(
            embed,
            { name: bold('Guilds:'), value: totalGuilds, inline: true },
            { name: bold('Members:'), value: totalMembers, inline: true },
            { name: '\u200b', value: '\u200b', inline: true },
            { name: bold('Total Messages:'), value: globalMessages.toLocaleString(), inline: true },
            { name: bold('Total Commands:'), value: globalCommandsUsed.toLocaleString(), inline: true },
            { name: '\u200b', value: '\u200b', inline: true }
        );

        return embed;
    }
}