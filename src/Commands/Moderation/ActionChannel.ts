import { cache } from '#khaf/cache/Settings.js';
import { Command } from '#khaf/Command';
import { sql } from '#khaf/database/Postgres.js';
import { kGuild } from '#khaf/types/KhafraBot.js';
import { isText } from '#khaf/utility/Discord.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { type UnsafeEmbed } from '@discordjs/builders';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { Message } from 'discord.js';

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Set the mod action log channel.',
                '#channel',
                '772957951941673000'
            ],
            {
                name: 'actionchannel',
                aliases: ['modlog', 'modlogs'],
                folder: 'Moderation',
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init (message: Message<true>): Promise<UnsafeEmbed> {
        if (!hasPerms(message.channel, message.member, PermissionFlagsBits.Administrator)) {
            return this.Embed.perms(
                message.channel,
                message.member,
                PermissionFlagsBits.Administrator
            );
        }

        const channel = await getMentions(message, 'channels') ?? message.channel;
        if (!isText(channel)) {
            return this.Embed.error('Channel isn\'t cached or the ID is incorrect.');
        }

        const rows = await sql<kGuild[]>`
            UPDATE kbGuild 
            SET mod_log_channel = ${channel.id}::text
            WHERE kbGuild.guild_id = ${message.guildId}::text
            RETURNING *;
        `;

        cache.set(message.guild.id, rows[0]);

        return this.Embed.ok(`
        Set public mod-logging channel to ${channel}!
        `);
    }
}