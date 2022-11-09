import { InteractionUserCommand } from '#khaf/Interaction'
import { logger } from '#khaf/Logger'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { cwd } from '#khaf/utility/Constants/Path.js'
import { createFileWatcher } from '#khaf/utility/FileWatcher.js'
import { bold, formatEmoji, inlineCode, italic, time } from '@discordjs/builders'
import {
  ActivityType,
  ApplicationCommandType,
  type RESTPostAPIApplicationCommandsJSONBody,
  type Snowflake
} from 'discord-api-types/v10'
import type { Activity, InteractionReplyOptions, UserContextMenuCommandInteraction, UserFlagsString } from 'discord.js'
import { join } from 'node:path'

const formatPresence = (activities: Activity[] | undefined): string => {
  if (!Array.isArray(activities)) return ''

  const push: string[] = []
  for (const activity of activities) {
    switch (activity.type) {
      case ActivityType.Custom: {
        push.push(`${activity.emoji ?? ''}${inlineCode(activity.state ?? 'N/A')}`)
        break
      }
      case ActivityType.Listening: {
        push.push(`Listening to ${activity.details} - ${activity.state ?? 'N/A'} on ${activity.name}.`)
        break
      }
      case ActivityType.Playing: {
        push.push(`Playing ${italic(activity.name)}.`)
        break
      }
      case ActivityType.Streaming: {
        const details = activity.details ?? activity.url
        push.push(
          `Streaming ${bold(activity.state ?? 'N/A')} on ${activity.name}` +
          `${details ? `- ${inlineCode(details)}` : ''}`
        )
        break
      }
      case ActivityType.Watching: {
        push.push(`Watching ${bold(activity.name)}${activity.url ? `at ${activity.url}` : ''}`)
        break
      }
      default:
        logger.warn(activity, 'unknown activity')
    }
  }

  return push.join('\n')
}

const config = createFileWatcher<typeof import('../../../config.json')>(join(cwd, 'config.json'))
const emojis = new Map<UserFlagsString, string>()

export class kUserCommand extends InteractionUserCommand {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'User info',
      type: ApplicationCommandType.User
    }

    super(sc)
  }

  async init (interaction: UserContextMenuCommandInteraction): Promise<InteractionReplyOptions> {
    const { targetUser: user, guild } = interaction

    if (emojis.size === 0) {
      const flags = Object.entries(config.emoji.flags) as [UserFlagsString, Snowflake][]
      for (const [flag, emojiID] of flags) {
        emojis.set(flag, formatEmoji(emojiID, false))
      }
    }

    const member = await guild?.members.fetch(user.id).catch(() => null) ?? null
    const flags = user.flags?.toArray() ?? []
    const badgeEmojis = flags
      .map(f => emojis.get(f))
      .filter((f): f is string => f !== undefined)

    return {
      embeds: [
        Embed.json({
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
            { name: bold('Account Created:'), value: time(user.createdAt, 'f'), inline: true }
          ]
        })
      ],
      ephemeral: true
    }
  }
}
