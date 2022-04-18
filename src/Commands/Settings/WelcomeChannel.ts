import { cache } from '#khaf/cache/Settings.js';
import { Command } from '#khaf/Command';
import { sql } from '#khaf/database/Postgres.js';
import type { kGuild } from '#khaf/types/KhafraBot.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { isText } from '#khaf/utility/Discord.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { type UnsafeEmbedBuilder } from '@discordjs/builders';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import type { Message } from 'discord.js';

const basic =
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.EmbedLinks;

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Set the welcome channel for messages when a user leaves, joins, or is kicked from the guild!',
                '#general', '705896428287033375'
            ],
            {
                name: 'welcome',
                folder: 'Settings',
                args: [1, 1],
                guildOnly: true,
                aliases: ['welcomechannel']
            }
        );
    }

    async init (message: Message<true>): Promise<UnsafeEmbedBuilder> {
        if (!hasPerms(message.channel, message.member, PermissionFlagsBits.Administrator)) {
            return Embed.perms(
                message.channel,
                message.member,
                PermissionFlagsBits.Administrator
            );
        }

        const channel = await getMentions(message, 'channels');

        if (!isText(channel)) {
            return Embed.error(`${channel} is not a text channel!`);
        } else if (!hasPerms(channel, message.guild.me, basic)) {
            return Embed.perms(channel, message.guild.me, basic);
        }

        const rows = await sql<kGuild[]>`
            UPDATE kbGuild
            SET welcome_channel = ${channel.id}::text
            WHERE guild_id = ${message.guildId}::text
            RETURNING *;
        `;

        cache.set(message.guild.id, rows[0]);

        return Embed.ok(`
        You will now receive messages in ${channel} when a user joins, leaves, is kicked, or banned from the server!
        `);
    }
}