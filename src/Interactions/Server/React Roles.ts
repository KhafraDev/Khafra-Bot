import { Interactions } from '#khaf/Interaction'
import { Buttons, Components } from '#khaf/utility/Constants/Components.js'
import { Embed } from '#khaf/utility/Constants/Embeds.js'
import { isGuildTextBased } from '#khaf/utility/Discord.js'
import { bitfieldToString } from '#khaf/utility/Permissions.js'
import type { RESTPostAPIApplicationCommandsJSONBody, Snowflake } from 'discord-api-types/v10'
import { ApplicationCommandOptionType, ChannelType, PermissionFlagsBits } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { GuildMember, GuildMemberRoleManager, resolveColor, Role } from 'discord.js'
import { parse } from 'twemoji-parser'

interface GuildMatchGroups {
  animated: undefined | 'a'
  name: string
  id: Snowflake
}

const guildEmojiRegex = /<?(?<animated>a)?:?(?<name>\w{2,32}):(?<id>\d{17,19})>?/
const perms = PermissionFlagsBits.SendMessages

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'react-role',
      description: 'Add a button that gives members a specified role when clicked on!',
      default_member_permissions: bitfieldToString([PermissionFlagsBits.ManageRoles]),
      dm_permission: false,
      options: [
        {
          type: ApplicationCommandOptionType.Channel,
          name: 'channel',
          description: 'Channel to post the message into.',
          required: true,
          channel_types: [
            ChannelType.GuildText,
            ChannelType.GuildAnnouncement,
            ChannelType.AnnouncementThread,
            ChannelType.PublicThread,
            ChannelType.PrivateThread,
            ChannelType.GuildVoice
          ]
        },
        {
          type: ApplicationCommandOptionType.Role,
          name: 'role',
          description: 'The role to apply when clicking on the button.',
          required: true
        },
        {
          type: ApplicationCommandOptionType.Boolean,
          name: 'only-add',
          description: 'Only allow a person to give themselves the role.'
        },
        {
          type: ApplicationCommandOptionType.Boolean,
          name: 'only-remove',
          description: 'Only allow a person to remove the role.'
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'message',
          description: 'The text the button message will display.'
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'icon',
          description: 'The icon the button should display.'
        }
        // once repeating choices are added, allow multiple roles!!!
      ]
    }

    super(sc)
  }

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const defaultPerms = BigInt(this.data.default_member_permissions!)

    if (!interaction.memberPermissions?.has(defaultPerms)) {
      return {
        content: '❌ You do not have permission to use this command!',
        ephemeral: true
      }
    } else if (
      interaction.guild === null ||
      interaction.member === null ||
      !interaction.guild.members.me ||
      !interaction.guild.members.me.permissions.has(defaultPerms)
    ) {
      return {
        content: '❌ I do not have full permissions in this guild, please re-invite with permission to manage channels.',
        ephemeral: true
      }
    }

    const channel = interaction.options.getChannel('channel', true)
    const role = interaction.options.getRole('role', true)
    const onlyAdd = interaction.options.getBoolean('only-add') ?? false
    const onlyRemove = interaction.options.getBoolean('only-remove') ?? false
    const icon = interaction.options.getString('icon')

    const action = onlyAdd ? 'add' : onlyRemove ? 'remove' : 'default'

    let text = interaction.options.getString('message')

    if (text === null) {
      if (action === 'add') {
        text = `Press the button below to give yourself the ${role} role.`
      } else if (action === 'remove') {
        text = `Press the button below to remove ${role} from yourself.`
      } else {
        text = `Press the button below to get the ${role} role!

                Clicking the button again will take the role away!`
      }
    }

    const memberPermissions = typeof interaction.member.permissions === 'string'
      ? BigInt(interaction.member.permissions)
      : interaction.member.permissions.bitfield

    if (!isGuildTextBased(channel)) {
      return {
        content: '❌ Invalid channel.',
        ephemeral: true
      }
    } else if (!channel.permissionsFor(interaction.guild.members.me).has(perms)) {
      return {
        content: '❌ I do not have permission to post a message in this channel!',
        ephemeral: true
      }
    } else if ((perms & memberPermissions) !== perms) {
      // Permissions are "... permissions of the member in the channel". So we check
      // if the member has the SEND_MESSAGE permission.
      return {
        content: '❌ You do not have permission to post a message in this channel!',
        ephemeral: true
      }
    } else if (role.managed) {
      return {
        content: '❌ I can\'t give members a managed role.',
        ephemeral: true
      }
    } else if (
      !(role instanceof Role) ||
      !(interaction.member instanceof GuildMember) ||
      !(interaction.member.roles instanceof GuildMemberRoleManager)
    ) {
      return {
        content:
          '❌ You need to re-invite me with the proper permissions (click the "Add to Server" button on my profile)!',
        ephemeral: true
      }
    } else if (
      role.id === interaction.guild.members.me.roles.highest.id ||
      // Negative if this role's position is lower (param is higher),
      // positive number if this one is higher (other's is lower), 0 if equal
      role.comparePositionTo(interaction.guild.members.me.roles.highest) > 0
    ) {
      return {
        content: '❌ I do not have enough permission to give others this role!',
        ephemeral: true
      }
    } else if (
      role.id === interaction.member.roles.highest.id ||
            role.comparePositionTo(interaction.member.roles.highest) > 0
    ) {
      return {
        content: '❌ You cannot give this role out to others!',
        ephemeral: true
      }
    }

    const label = `${action === 'remove' ? 'Remove' : 'Get'} ${role.name.slice(0, 80)}`
    const component = Buttons.approve(label, `react-role,${action},${role.id}`)

    if (icon) {
      if (guildEmojiRegex.test(icon)) {
        const match = guildEmojiRegex.exec(icon) as RegExpExecArray & { groups: GuildMatchGroups }
        component.emoji = {
          animated: match.groups.animated ? true : undefined,
          id: match.groups.id,
          name: match.groups.name
        }
      } else {
        const parsed = parse(icon)

        if (parsed.length !== 0) {
          component.emoji = { name: parsed[0].text }
        }
      }
    }

    const message = await channel.send({
      embeds: [
        Embed.json({
          color: resolveColor(role.hexColor),
          description: text
        })
      ],
      components: [
        Components.actionRow([component])
      ]
    })

    return {
      embeds: [
        Embed.ok(`Ok! Click [the button here](${message.url}) to get the ${role} role!`)
      ]
    }
  }
}
