import { Interactions } from '#khaf/Interaction'
import { logger } from '#khaf/structures/Logger.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { userflagBitfieldToEmojis } from '#khaf/utility/util.js'
import { bold, inlineCode, italic, time } from '@discordjs/builders'
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import { ActivityType, ApplicationCommandOptionType } from 'discord-api-types/v10'
import type {
  Activity,
  ChatInputCommandInteraction,
  InteractionReplyOptions
} from 'discord.js'
import { GuildMember, Role, SnowflakeUtil, User } from 'discord.js'

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

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'info',
      description: 'Gets info about a user, guild member, channel, or role.',
      options: [
        {
          type: ApplicationCommandOptionType.Mentionable,
          name: 'user-role-or-member',
          description: 'Role, member, or user to get information about.',
          required: true
        }
      ]
    }

    super(sc)
  }

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
    const option = interaction.options.getMentionable('user-role-or-member', true)
    const createdAt = 'joined_at' in option
      ? new Date(option.joined_at)
      : new Date(SnowflakeUtil.timestampFrom(option.id))

    if (option instanceof GuildMember) {
      const embed = Embed.json({
        color: colors.ok,
        author: {
          name: option.displayName,
          icon_url: option.user.displayAvatarURL()
        },
        description: `
          ${option} on ${italic(option.guild.name)}.
          ${formatPresence(option.presence?.activities)}
          
          Roles:
          ${[...option.roles.cache.filter(r => r.name !== '@everyone').values()].slice(0, 20).join(', ')}
          `,
        thumbnail: { url: option.user.displayAvatarURL() },
        fields: [
          { name: bold('Role Color:'), value: option.displayHexColor, inline: true },
          { name: bold('Joined Guild:'), value: time(option.joinedAt ?? new Date()), inline: true },
          { name: '\u200b', value: '\u200b', inline: true },
          {
            name: bold('Boosting Since:'),
            value: option.premiumSince ? time(option.premiumSince) : 'Not boosting',
            inline: true
          },
          { name: bold('Account Created:'), value: time(createdAt, 'f'), inline: true },
          { name: '\u200b', value: '\u200b', inline: true }
        ],
        footer: { text: 'For general user info mention a user!' }
      })

      return {
        embeds: [embed]
      }
    } else if (option instanceof Role) {
      const embed = Embed.json({
        color: colors.ok,
        description: `
          ${option}
          
          Permissions: 
          ${inlineCode(option.permissions.toArray().join(', '))}
          `,
        fields: [
          { name: bold('Name:'), value: option.name, inline: true },
          { name: bold('Color:'), value: option.hexColor, inline: true },
          { name: bold('Created:'), value: time(option.createdAt), inline: true },
          { name: bold('Mentionable:'), value: option.mentionable ? 'Yes' : 'No', inline: true },
          { name: bold('Hoisted:'), value: option.hoist ? 'Yes' : 'No', inline: true },
          { name: bold('Position:'), value: `${option.position}`, inline: true },
          { name: bold('Managed:'), value: option.managed ? 'Yes' : 'No', inline: true }
        ],
        image: option.icon ? { url: option.iconURL()! } : undefined
      })

      return {
        embeds: [embed]
      }
    } else if (option instanceof User) {
      const member = await interaction.guild?.members.fetch(option.id)
        .catch(() => null) ?? null

      const flags = option.flags?.toArray() ?? []
      const badgeEmojis = userflagBitfieldToEmojis(flags)

      const embed = Embed.json({
        color: colors.ok,
        description: formatPresence(member?.presence?.activities),
        author: {
          name: option.tag,
          icon_url: option.displayAvatarURL()
        },
        fields: [
          { name: bold('Username:'), value: option.username, inline: true },
          { name: bold('ID:'), value: option.id, inline: true },
          { name: bold('Discriminator:'), value: `#${option.discriminator}`, inline: true },
          { name: bold('Bot:'), value: option.bot ? 'Yes' : 'No', inline: true },
          {
            name: bold('Badges:'),
            value: `${badgeEmojis.length > 0 ? badgeEmojis.join(' ') : 'None/Unknown'}`,
            inline: true
          },
          { name: bold('Account Created:'), value: time(createdAt, 'f'), inline: true }
        ]
      })

      return {
        embeds: [embed]
      }
    }
  }
}
