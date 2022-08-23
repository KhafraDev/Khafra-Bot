import { cache } from '#khaf/cache/Settings.js'
import { sql } from '#khaf/database/Postgres.js'
import type { kGuild } from '#khaf/types/KhafraBot.js'
import { isGuildTextBased } from '#khaf/utility/Discord.js'
import type { APIEmbed } from 'discord-api-types/v10'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import type {
    ChatInputCommandInteraction,
    MessageContextMenuCommandInteraction,
    UserContextMenuCommandInteraction
} from 'discord.js'

type Interactions =
    | ChatInputCommandInteraction
    | UserContextMenuCommandInteraction
    | MessageContextMenuCommandInteraction

const perms =
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.EmbedLinks

/**
 * Fetches the guild settings given a ChatInputCommandInteraction, or
 * null if the command is not in a guild or an error occurs.
 */
export const interactionGetGuildSettings = async (interaction: Interactions): Promise<kGuild | null> => {
    if (!interaction.inGuild()) return null

    let settings: kGuild
    const row = cache.get(interaction.guildId)

    if (row) {
        settings = row
    } else {
        const rows = await sql<kGuild[]>`
            SELECT * 
            FROM kbGuild
            WHERE guild_id = ${interaction.guildId}::text
            LIMIT 1;
        `

        if (rows.length !== 0) {
            cache.set(interaction.guildId, rows[0])
            settings = rows[0]
        } else {
            return null
        }
    }

    return settings
}

export const postToModLog = async (
    interaction: ChatInputCommandInteraction,
    embeds: APIEmbed[],
    guildSettings?: kGuild | null
): Promise<undefined> => {
    const settings = guildSettings ?? await interactionGetGuildSettings(interaction)

    if (settings?.mod_log_channel) {
        const self = interaction.guild?.members.me
        const channel = await (interaction.guild ?? interaction.client).channels
            .fetch(settings.mod_log_channel)
            .catch(() => null)

        if (channel === null || self === null || self === undefined) {
            return
        } else if (!isGuildTextBased(channel)) {
            return
        } else if (!channel.permissionsFor(self).has(perms)) {
            return
        }

        return void channel.send({ embeds })
    }
}

export const isSnowflake = (id: string): boolean => {
    if (id.length < 17 || id.length > 19) {
        return false
    }

    for (let i = 0; i < id.length; i++) {
        const char = id.charCodeAt(i)
        if (char < 48 || char > 57) { // 0 - 9
            return false
        }
    }

    return true
}