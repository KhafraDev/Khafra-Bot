import { sql } from '#khaf/database/Postgres.mjs'
import { logger } from '#khaf/Logger'
import type { kGuild } from '#khaf/types/KhafraBot.js'
import { cwd } from '#khaf/utility/Constants/Path.mjs'
import { isGuildTextBased } from '#khaf/utility/Discord.js'
import { createFileWatcher } from '#khaf/utility/FileWatcher.mjs'
import { bold, inlineCode, italic } from '@discordjs/builders'
import {
  ActivityType,
  ChannelType,
  MessageType,
  PermissionFlagsBits,
  type APIEmbed,
  type ApplicationFlags,
  type Snowflake
} from 'discord-api-types/v10'
import {
  formatEmoji,
  type Activity,
  type ChatInputCommandInteraction,
  type Message,
  type UserFlagsString
} from 'discord.js'
import { Buffer } from 'node:buffer'
import { join } from 'node:path'
import { pipeline, type Readable } from 'node:stream'
import zlib from 'node:zlib'
import type { Dispatcher } from 'undici'

const perms =
  PermissionFlagsBits.ViewChannel |
  PermissionFlagsBits.SendMessages |
  PermissionFlagsBits.EmbedLinks

const config = createFileWatcher<typeof import('../../../config.json')>(join(cwd, 'config.json'))

type FromKeys<K extends keyof kGuild | undefined> = K extends keyof kGuild
  ? { [Key in keyof kGuild as Key extends K ? Key : never]: kGuild[Key] }
  : kGuild

// https://stackoverflow.com/a/50375286/15299271
type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

// https://stackoverflow.com/a/63542565/15299271
type MagicType<U> = UnionToIntersection<U> extends infer O ? { [K in keyof O]: O[K] } : never

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
 * Fetches the guild settings
 */
export const guildSettings = async <K extends keyof kGuild>(
  guildId: string,
  keys?: undefined | K[]
): Promise<MagicType<FromKeys<K>> | null> => {
  const key = keys?.length ? sql(keys as string[]) : sql.unsafe('*')

  const [settings = null] = await sql<[kGuild?]>`
    SELECT ${key} FROM kbGuild
    WHERE guild_id = ${guildId}::text
    LIMIT 1;
  `

  return settings as MagicType<FromKeys<K>> | null
}

export const postToModLog = async (
  interaction: ChatInputCommandInteraction,
  embeds: APIEmbed[]
): Promise<undefined> => {
  if (!interaction.inCachedGuild()) {
    return
  }

  const settings = await guildSettings(interaction.guildId, ['mod_log_channel'])

  if (settings?.mod_log_channel) {
    const self = await interaction.guild.members.fetchMe()
    const channel = await interaction.guild.channels.fetch(settings.mod_log_channel)

    if (!channel || !isGuildTextBased(channel)) {
      return
    } else if (!channel.permissionsFor(self).has(perms)) {
      return
    }

    await channel.send({ embeds })
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

/**
 * @see https://discord.com/developers/docs/resources/user#user-object-user-flags
 */
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
            ? formatEmoji(activity.emoji.id, !!activity.emoji.animated)
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

export const formatApplicationPresence = (key: keyof typeof ApplicationFlags): string => {
  switch (key) {
    case 'GatewayPresence':
      return 'has Presence Intent'
    case 'GatewayPresenceLimited':
      return 'has Presence Intent (limited)'
    case 'GatewayGuildMembers':
      return 'has Guild Member Intent'
    case 'GatewayGuildMembersLimited':
      return 'has Guild Member Intent (limited)'
    case 'VerificationPendingGuildLimit':
      return 'is Pending Verification'
    case 'Embedded':
      return 'is Embedded'
    case 'GatewayMessageContent':
      return 'has Message Content Intent'
    case 'GatewayMessageContentLimited':
      return 'has Message Content Intent (limited)'
    case 'ApplicationCommandBadge':
      return 'has Application Command Badge'
  }

  return 'OK TYPESCRIPT'
}

// https://github.com/typescript-eslint/typescript-eslint/issues/5449
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
export const createDeferredPromise = <T extends unknown>(): {
  promise: Promise<T>
  resolve: (v: T) => void
  reject: (error?: Error) => void
} => {
  let resolve!: (v: T) => void
  let reject!: (error?: Error) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

// https://fetch.spec.whatwg.org/#redirect-status
const redirectStatuses = [301, 302, 303, 307, 308]

const nullBodyStatus = [101, 204, 205, 304]

export const isRedirect = (statusCode: number): boolean =>
  redirectStatuses.includes(statusCode)

export const arrayBufferToBuffer = (buffer: ArrayBuffer): Buffer => {
  if (ArrayBuffer.isView(buffer)) {
    return Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  }

  return Buffer.from(buffer, buffer.byteLength)
}

/*! undici. MIT License. https://github.com/nodejs/undici/blob/3606c3556aa637005c8123036bdebc9ffc4b77ec/lib/fetch/index.js#L1992-L2012 */
export const decompressBody = (response: Dispatcher.ResponseData): Readable => {
  const decoders = []
  const encoding = response.headers['content-encoding']

  if (typeof encoding !== 'string') {
    return response.body
  }

  const codings = encoding.split(',').map((x) => x.trim())
  const willFollow = response.headers.location && isRedirect(response.statusCode)

  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding
  if (!nullBodyStatus.includes(response.statusCode) && !willFollow) {
    for (const coding of codings) {
      if (/(x-)?gzip/.test(coding)) {
        decoders.push(zlib.createGunzip())
      } else if (/(x-)?deflate/.test(coding)) {
        decoders.push(zlib.createInflate())
      } else if (coding === 'br') {
        decoders.push(zlib.createBrotliDecompress())
      } else {
        decoders.length = 0
        break
      }
    }
  }

  if (decoders.length) {
    return pipeline(
      response.body as never,
      ...decoders as never[],
      () => {}
    ) as unknown as Readable
  }

  return response.body
}

// https://github.com/typescript-eslint/typescript-eslint/issues/5449
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
export const chunkSafe = <T extends unknown>(arr: T[], step: number): T[][] => {
  const res: T[][] = []
  for (let i = 0; i < arr.length; i += step)
    res.push(arr.slice(i, i + step))

  return res
}

export const splitEvery = (text: string, step: number): string[] => {
  const split: string[] = []

  while (text.length) {
    const sliced = text.slice(0, step)
    split.push(sliced)
    text = text.slice(step)
  }

  return split
}
