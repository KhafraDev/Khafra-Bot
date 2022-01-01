import { client as Client } from '#khaf/Client';
import { pool } from '#khaf/database/Postgres.js';
import { client } from '#khaf/database/Redis.js';
import { MessageEmbed } from '#khaf/Embed';
import type { kGuild } from '#khaf/types/KhafraBot.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { AnyChannel, CommandInteraction, Snowflake, Permissions } from 'discord.js';
import { isTextBased } from '#khaf/utility/Discord.js';
import { hasPerms } from '#khaf/utility/Permissions.js';

const perms = new Permissions([
    Permissions.FLAGS.VIEW_CHANNEL,
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.EMBED_LINKS
]);

/**
 * Fetches the guild settings given a CommandInteraction, or
 * null if the command is not in a guild or an error occurs. 
 */
export const interactionGetGuildSettings = async (interaction: CommandInteraction) => {
    if (!interaction.inGuild()) return null;

    let settings: kGuild;
    const row = await client.get(interaction.guildId);

    if (row) {
        settings = JSON.parse(row) as kGuild;
    } else {
        const { rows } = await pool.query<kGuild>(`
            SELECT * 
            FROM kbGuild
            WHERE guild_id = $1::text
            LIMIT 1;
        `, [interaction.guildId]);

        if (rows.length !== 0) {
            await client.set(interaction.guildId, JSON.stringify(rows[0]), 'EX', 600);

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
    interaction: CommandInteraction,
    id: Snowflake
) => {
    const channelManager = interaction.guild?.channels;
    let channel: AnyChannel;

    if (channelManager?.cache.has(id)) {
        return channelManager.cache.get(id);
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
    interaction: CommandInteraction,
    embeds: MessageEmbed[],
    guildSettings?: kGuild | null
) => {
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