import { Interactions } from '#khaf/Interaction'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { minutes } from '#khaf/utility/ms.js'
import { formatPresence, userflagBitfieldToEmojis } from '#khaf/utility/util.js'
import { bold, inlineCode, italic, time } from '@discordjs/builders'
import {
  ApplicationCommandOptionType,
  InteractionType,
  type RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10'
import {
  GuildMember,
  InteractionCollector, Role,
  SnowflakeUtil,
  User,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type InteractionReplyOptions
} from 'discord.js'
import { randomUUID } from 'node:crypto'

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

    if (option instanceof GuildMember || option instanceof User) {
      const isGuildMember = option instanceof GuildMember

      const user = 'user' in option ? option.user : option
      const member = isGuildMember ?
        option
        : await interaction.guild?.members.fetch(option.id).catch(() => null) ?? null

      let currentPage: 'user' | 'member' = isGuildMember ? 'member' : 'user'
      const flags = user.flags?.bitfield
      const badgeEmojis = userflagBitfieldToEmojis(flags)

      const userEmbed = Embed.json({
        color: colors.ok,
        description: formatPresence(member?.presence?.activities),
        author: {
          name: user.tag,
          icon_url: option.displayAvatarURL()
        },
        fields: [
          { name: bold('Username:'), value: user.username, inline: true },
          { name: bold('ID:'), value: option.id, inline: true },
          { name: bold('Discriminator:'), value: `#${user.discriminator}`, inline: true },
          { name: bold('Bot:'), value: user.bot ? 'Yes' : 'No', inline: true },
          {
            name: bold('Badges:'),
            value: `${badgeEmojis.length > 0 ? badgeEmojis.join(' ') : 'None/Unknown'}`,
            inline: true
          },
          { name: bold('Account Created:'), value: time(createdAt, 'f'), inline: true }
        ]
      })

      const memberEmbed = !member ? null : Embed.json({
        color: colors.ok,
        author: {
          name: member.displayName,
          icon_url: user.displayAvatarURL()
        },
        description: `
          ${option} on ${italic(member.guild.name)}.
          ${formatPresence(member.presence?.activities)}
          
          Roles:
          ${[...member.roles.cache.filter(r => r.name !== '@everyone').values()].slice(0, 20).join(', ')}
          `,
        thumbnail: { url: user.displayAvatarURL() },
        fields: [
          { name: bold('Role Color:'), value: member.displayHexColor, inline: true },
          { name: bold('Joined Guild:'), value: time(member.joinedAt ?? new Date()), inline: true },
          { name: '\u200b', value: '\u200b', inline: true },
          {
            name: bold('Boosting Since:'),
            value: member.premiumSince ? time(member.premiumSince) : 'Not boosting',
            inline: true
          },
          { name: bold('Account Created:'), value: time(createdAt, 'f'), inline: true },
          { name: '\u200b', value: '\u200b', inline: true }
        ],
        footer: { text: 'For general user info mention a user!' }
      })

      const id = randomUUID()
      const makeOptions = (): InteractionReplyOptions & { fetchReply: true } => ({
        embeds: [
          currentPage === 'user' ? userEmbed : (memberEmbed ?? userEmbed)
        ],
        components: [
          Components.actionRow([
            Buttons.primary(
              currentPage === 'user' ? 'Member Info' : 'User Info',
              id,
              {
                disabled: currentPage === 'user' && member === null
              }
            )
          ])
        ],
        fetchReply: true
      })

      const message = await interaction.reply(makeOptions())

      const collector = new InteractionCollector<ButtonInteraction>(interaction.client, {
        interactionType: InteractionType.MessageComponent,
        message,
        time: minutes(2),
        max: 10,
        filter: (i) =>
          interaction.user.id === i.user.id &&
          message.id === i.message.id &&
          i.customId === id
      })

      for await (const [i] of collector) {
        currentPage = currentPage === 'user' && memberEmbed ? 'member' : 'user'

        const { embeds, components } = makeOptions()
        await i.update({ embeds, components })
      }

      await interaction.editReply({
        components: disableAll(message)
      })
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
    }
  }
}
