import { cache } from '#khaf/cache/Settings.js';
import { client as Client } from '#khaf/Client';
import { sql } from '#khaf/database/Postgres.js';
import type { kGuild } from '#khaf/types/KhafraBot.js';
import { isTextBased } from '#khaf/utility/Discord.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { type UnsafeEmbed } from '@discordjs/builders';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import {
    AnyChannel,
    ChatInputCommandInteraction,
    MessageContextMenuCommandInteraction,
    Snowflake,
    UserContextMenuCommandInteraction
} from 'discord.js';

type Interactions =
    | ChatInputCommandInteraction
    | UserContextMenuCommandInteraction
    | MessageContextMenuCommandInteraction;

const perms =
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.EmbedLinks;

/**
 * Fetches the guild settings given a ChatInputCommandInteraction, or
 * null if the command is not in a guild or an error occurs.
 */
export const interactionGetGuildSettings = async (interaction: Interactions): Promise<kGuild | null> => {
    if (!interaction.inGuild()) return null;

    let settings: kGuild;
    const row = cache.get(interaction.guildId);

    if (row) {
        settings = row;
    } else {
        const rows = await sql<kGuild[]>`
            SELECT * 
            FROM kbGuild
            WHERE guild_id = ${interaction.guildId}::text
            LIMIT 1;
        `;

        if (rows.length !== 0) {
            cache.set(interaction.guildId, rows[0]);
            settings = rows[0];
        } else {
            return null;
        }
    }

    return settings;
}

/**
 * Fetches a channel with the id provided or null if
 * it cannot be fetched.
 */
export const interactionFetchChannel = async (
    interaction: Interactions,
    id: Snowflake
): Promise<AnyChannel | null> => {
    const channelManager = interaction.guild?.channels;
    let channel: AnyChannel;

    if (channelManager?.cache.has(id)) {
        return channelManager.cache.get(id) ?? null;
    } else {
        const promise = interaction.guild
            ? channelManager!.fetch(id)
            : Client.channels.fetch(id);

        const [fetchErr, fetched] = await dontThrow(promise);

        if (fetchErr !== null || fetched === null) {
            return null;
        }

        channel = fetched;
    }

    return channel;
}

export const postToModLog = async (
    interaction: ChatInputCommandInteraction,
    embeds: UnsafeEmbed[],
    guildSettings?: kGuild | null
): Promise<undefined> => {
    const settings = guildSettings ?? await interactionGetGuildSettings(interaction);

    if (settings?.mod_log_channel) {
        const channel = await interactionFetchChannel(
            interaction,
            settings.mod_log_channel
        );

        if (!isTextBased(channel) || !hasPerms(channel, interaction.guild?.me, perms))
            return;

        return void dontThrow(channel.send({ embeds }));
    }
}