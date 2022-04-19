import { cache } from '#khaf/cache/Settings.js';
import type { Arguments} from '#khaf/Command';
import { Command } from '#khaf/Command';
import { sql } from '#khaf/database/Postgres.js';
import type { kGuild } from '#khaf/types/KhafraBot.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { Range } from '#khaf/utility/Valid/Number.js';
import { inlineCode } from '@discordjs/builders';
import type { APIEmbed} from 'discord-api-types/v10';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import type { Message } from 'discord.js';

const inRange = Range({ min: 0, max: 32767, inclusive: true }); // small int

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Set the amount of warning points it requires before a member is kicked. Max = 32,767.',
                '100',
                '20',
                '32767'
            ],
            {
                name: 'warnlimit',
                aliases: ['limit', 'setwarn'],
                folder: 'Moderation',
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init (message: Message<true>, { args }: Arguments): Promise<APIEmbed> {
        const newAmount = Number(args[0]!);

        if (!hasPerms(message.channel, message.member, PermissionFlagsBits.Administrator))
            return Embed.perms(
                message.channel,
                message.member,
                PermissionFlagsBits.Administrator
            );
        else if (!inRange(newAmount))
            return Embed.error('An invalid number of points was provided, try with a positive whole number instead!');

        const rows = await sql<kGuild[]>`
            UPDATE kbGuild
            SET max_warning_points = ${newAmount}::smallint
            WHERE guild_id = ${message.guildId}::text
            RETURNING *;
        `;

        cache.set(message.guild.id, rows[0]);

        return Embed.ok(`Set the max warning points limit to ${inlineCode(newAmount.toLocaleString())}!`);
    }
}