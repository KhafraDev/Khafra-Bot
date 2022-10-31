import { sql } from '#khaf/database/Postgres.js'
import type { kGuild } from '#khaf/types/KhafraBot.js'
import { isGuildTextBased } from '#khaf/utility/Discord.js'
import type { APIEmbed } from 'discord-api-types/v10'
import { ChannelType, MessageType, PermissionFlagsBits } from 'discord-api-types/v10'
import type {
  ChatInputCommandInteraction, Message, MessageContextMenuCommandInteraction,
  UserContextMenuCommandInteraction
} from 'discord.js'

const perms =
  PermissionFlagsBits.ViewChannel |
  PermissionFlagsBits.SendMessages |
  PermissionFlagsBits.EmbedLinks

type Interactions =
  | ChatInputCommandInteraction
  | UserContextMenuCommandInteraction
  | MessageContextMenuCommandInteraction

/**
 * Check message for required criteria.
 * @param message
 */
export const Sanitize = (message: Message): message is Message<true> => {
  if (
    message.webhookId || // author is null in webhook messages
        message.author.bot ||
        (message.type !== MessageType.Default && message.type !== MessageType.Reply) ||
        message.system ||
        message.tts ||
        message.content.length === 0 ||
        !message.guild?.available
  ) {
    return false
  }

  const { channel, guild } = message
  const self = guild.members.me

  if (channel.type === ChannelType.DM) {
    return true
  }

  if (self === null) {
    return false
  }

  return channel.permissionsFor(self).has(perms)
}

/**
 * Fetches the guild settings given a ChatInputCommandInteraction, or
 * null if the command is not in a guild or an error occurs.
 */
export const interactionGetGuildSettings = async (interaction: Interactions): Promise<kGuild | null> => {
  if (!interaction.inGuild()) return null

  const [settings = null] = await sql<[kGuild?]>`
    SELECT * 
    FROM kbGuild
    WHERE guild_id = ${interaction.guildId}::text
    LIMIT 1;
  `

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
