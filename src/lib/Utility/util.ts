import { sql } from '#khaf/database/Postgres.js'
import { logger } from '#khaf/Logger'
import type { kGuild } from '#khaf/types/KhafraBot.js'
import { cwd } from '#khaf/utility/Constants/Path.js'
import { isGuildTextBased } from '#khaf/utility/Discord.js'
import { createFileWatcher } from '#khaf/utility/FileWatcher.js'
import { bold, inlineCode, italic } from '@discordjs/builders'
import {
  ActivityType,
  ChannelType,
  MessageType,
  PermissionFlagsBits,
  type APIEmbed,
  type Snowflake
} from 'discord-api-types/v10'
import {
  formatEmoji,
  type Activity,
  type ChatInputCommandInteraction,
  type Message,
  type MessageContextMenuCommandInteraction,
  type UserContextMenuCommandInteraction,
  type UserFlagsString
} from 'discord.js'
import { join } from 'node:path'

const perms =
  PermissionFlagsBits.ViewChannel |
  PermissionFlagsBits.SendMessages |
  PermissionFlagsBits.EmbedLinks

const config = createFileWatcher<typeof import('../../../config.json')>(join(cwd, 'config.json'))

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

const badgeCache = new Map<UserFlagsString, [number, Snowflake]>()

export const getBadgeEmojis = (): typeof badgeCache => {
  if (badgeCache.size === 0) {
    const flags = Object.entries(config.emoji.flags) as [UserFlagsString, [number, Snowflake]][]
    for (const [flag, [bitfield, emojiID]] of flags) {
      badgeCache.set(flag, [bitfield, formatEmoji(emojiID, false)])
    }
  }

  return badgeCache
}

export const userflagBitfieldToEmojis = (flags: unknown): string[] => {
  if (!flags || typeof flags !== 'number') {
    return []
  }

  const badgeEmojis: string[] = []
  const emojis = getBadgeEmojis()

  for (const [bitfield, emoji] of emojis.values()) {
    if ((flags & bitfield) === bitfield) {
      badgeEmojis.push(emoji)
    }
  }

  return badgeEmojis
}

export const formatPresence = (activities: Activity[] | undefined): string => {
  if (!Array.isArray(activities)) {
    return ''
  }

  let desc = ''

  for (const activity of activities) {
    switch (activity.type) {
      case ActivityType.Custom: {
        if (activity.emoji) {
          desc += activity.emoji.id
            ? formatEmoji(activity.emoji.id, !!activity.emoji.animated as true)
            : activity.emoji.name
        }
        desc += `${inlineCode(activity.state ?? 'N/A')}\n`
        break
      }
      case ActivityType.Listening: {
        if (activity.name === 'Spotify') {
          const emoji = formatEmoji(config.interactions.spotify)
          desc += `${emoji} ${activity.details} - ${activity.state}\n`
        } else {
          desc += `Listening to ${activity.details} - ${activity.state ?? 'N/A'} on ${activity.name}.\n`
        }
        break
      }
      case ActivityType.Playing: {
        desc += `Playing ${italic(activity.name)}.\n`
        break
      }
      case ActivityType.Streaming: {
        if (activity.name === 'Twitch') {
          const emoji = formatEmoji(config.interactions.twitch)
          desc += `${emoji} ${activity.state} - ${activity.details}\n`
        } else {
          const details = activity.details ?? activity.url
          desc +=
            `Streaming ${bold(activity.state ?? 'N/A')} on ${activity.name}` +
            `${details ? `- ${inlineCode(details)}` : ''}\n`
        }
        break
      }
      case ActivityType.Watching: {
        if (activity.name === 'Watch Together') {
          const emoji = formatEmoji(config.interactions.youtube)
          desc += `${emoji} ${activity.name} - ${activity.details}\n`
        } else {
          desc += `Watching ${bold(activity.name)}${activity.url ? `at ${activity.url}` : ''}\n`
        }
        break
      }
      default:
        logger.warn(activity, 'unknown activity')
    }
  }

  return desc.trimEnd()
}

export const formatMs = (ms: number): string => {
  const durations: Record<string, number> = {
    d: Math.floor(ms / 86400000),
    h: Math.floor(ms / 3600000) % 24,
    m: Math.floor(ms / 60000) % 60,
    s: Math.floor(ms / 1000) % 60,
    ms: Math.floor(ms) % 1000
  }

  return Object.keys(durations)
    .map(k => durations[k] > 0 ? `${durations[k]}${k}` : '')
    .join(' ')
}
