import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { logger } from '#khaf/structures/Logger.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { cwd } from '#khaf/utility/Constants/Path.js'
import { createFileWatcher } from '#khaf/utility/FileWatcher.js'
import { getMentions } from '#khaf/utility/Mentions.js'
import { bold, formatEmoji, inlineCode, italic, time } from '@discordjs/builders'
import type { APIEmbed } from 'discord-api-types/v10'
import { ActivityType } from 'discord-api-types/v10'
import type { Activity, Message, Snowflake, UserFlagsString } from 'discord.js'
import { join } from 'node:path'

const config = createFileWatcher<typeof import('../../../../config.json')>(join(cwd, 'config.json'))

// found some of these images on a 3 year old reddit post
// https://www.reddit.com/r/discordapp/comments/8oa1jg/discord_badges/e025kpl

const formatPresence = (activities: Activity[] | undefined): string => {
  if (!Array.isArray(activities)) return ''
  const push: string[] = []

  for (const activity of activities) {
    switch (activity.type) {
      case ActivityType.Custom:
        push.push(`${activity.emoji ?? ''}${activity.state ? ` ${inlineCode(activity.state)}` : ''}`)
        break
      case ActivityType.Listening:
        push.push(`Listening to ${activity.details} - ${activity.state ?? 'N/A'} on ${activity.name}.`)
        break
      case ActivityType.Playing:
        push.push(`Playing ${italic(activity.name)}.`)
        break
      default:
        logger.warn(activity, 'unknown activity')
    }
  }

  return push.join('\n')
}

const emojis = new Map<UserFlagsString, string>()

// 84484653687267328 -> Certified moderator; early supporter; partnered server owner; early verified bot owner; brilliance
// 173547401905176585 -> Discord employee; bravery
// 104360151208706048 -> balance
// 140214425276776449 -> bug hunter 1
// 73193882359173120 -> hypesquad events; bug hunter 2

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Get basic info about any user on Discord.',
        '@Khafra#0001', '165930518360227842'
      ],
      {
        name: 'user',
        folder: 'Server',
        args: [0, 1],
        aliases: ['userinfo'],
        guildOnly: true
      }
    )
  }

  async init (message: Message<true>, { content }: Arguments): Promise<APIEmbed> {
    if (emojis.size === 0) {
      const flags = Object.entries(config.emoji.flags) as [UserFlagsString, Snowflake][]
      for (const [flag, emojiID] of flags) {
        emojis.set(flag, formatEmoji(emojiID, false))
      }
    }

    const user = await getMentions(message, 'users', content) ?? message.author
    const member = await message.guild.members.fetch(user.id)
      .catch(() => null)

    const flags = user.flags?.toArray() ?? []
    const badgeEmojis = flags
      .map(f => emojis.get(f))
      .filter((f): f is string => f !== undefined)

    return Embed.json({
      color: colors.ok,
      description: formatPresence(member?.presence?.activities),
      author: {
        name: user.tag,
        icon_url: user.displayAvatarURL()
      },
      fields: [
        { name: bold('Username:'), value: user.username, inline: true },
        { name: bold('ID:'), value: user.id, inline: true },
        { name: bold('Discriminator:'), value: `#${user.discriminator}`, inline: true },
        { name: bold('Bot:'), value: user.bot ? 'Yes' : 'No', inline: true },
        {
          name: bold('Badges:'),
          value: `${badgeEmojis.length > 0 ? badgeEmojis.join(' ') : 'None/Unknown'}`,
          inline: true
        },
        { name: bold('Account Created:'), value: time(user.createdAt), inline: true }
      ]
    })
  }
}
