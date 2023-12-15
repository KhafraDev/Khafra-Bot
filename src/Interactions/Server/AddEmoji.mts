import { ImageUtil } from '#khaf/image/ImageUtil.mjs'
import { Interactions } from '#khaf/Interaction'
import { bitfieldToString } from '#khaf/utility/Permissions.mjs'
import { inlineCode } from '@discordjs/builders'
import type { APIRole, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions, Role } from 'discord.js'

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'addemoji',
      description: 'Adds an emoji to the server!',
      default_member_permissions: bitfieldToString([PermissionFlagsBits.ManageEmojisAndStickers]),
      dm_permission: false,
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'name',
          description: 'The name of the emoji!',
          required: true
        },
        {
          type: ApplicationCommandOptionType.Attachment,
          name: 'emoji',
          description: 'The emoji to add!',
          required: true
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'reason',
          description: 'Reason for creating this emoji that will show in audit logs.'
        },
        {
          type: ApplicationCommandOptionType.Role,
          name: 'role1',
          description: 'Limit the emoji to this role.'
        },
        {
          type: ApplicationCommandOptionType.Role,
          name: 'role2',
          description: 'Limit the emoji to this role.'
        },
        {
          type: ApplicationCommandOptionType.Role,
          name: 'role3',
          description: 'Limit the emoji to this role.'
        },
        {
          type: ApplicationCommandOptionType.Role,
          name: 'role4',
          description: 'Limit the emoji to this role.'
        },
        {
          type: ApplicationCommandOptionType.Role,
          name: 'role5',
          description: 'Limit the emoji to this role.'
        }
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
    } else if (!interaction.guild?.members.me?.permissions.has(defaultPerms)) {
      return {
        content:
          '❌ I do not have full permissions in this guild, please re-invite with permission to manage channels.',
        ephemeral: true
      }
    }

    const attachment = interaction.options.getAttachment('emoji', true)
    const name = interaction.options.getString('name', true)
    const reason = interaction.options.getString('reason') ?? undefined
    const roles: (Role | APIRole)[] = []

    if (!ImageUtil.isImage(attachment.proxyURL, attachment.contentType)) {
      return {
        content: 'What am I supposed to do with that? That\'s not an image!',
        ephemeral: true
      }
    }

    for (let i = 1; i <= 5; i++) {
      const role = interaction.options.getRole(`role${i}`)

      if (role) {
        roles.push(role)
      }
    }

    if (attachment.size > 256_000) {
      const kb = (attachment.size / 1000).toLocaleString(interaction.locale)
      return {
        content: `❌ Emoji must be under 256 KB in size (got ${inlineCode(kb)} kb).`,
        ephemeral: true
      }
    }

    const emoji = await interaction.guild.emojis.create({
      name,
      reason,
      attachment: attachment.proxyURL,
      roles: roles.map((role) => role.id)
    })

    return {
      content: `${emoji} is now a guild emoji!`
    }
  }
}
