import { Interactions } from '#khaf/Interaction'
import * as util from '#khaf/utility/util.js'
import { bitfieldToString } from '#khaf/utility/Permissions.js'
import { inlineCode } from '@discordjs/builders'
import {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
  RESTJSONErrorCodes, type RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, DiscordAPIError, InteractionReplyOptions } from 'discord.js'

const perms = PermissionFlagsBits.BanMembers

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'unban',
      description: 'Unban a member!',
      default_member_permissions: bitfieldToString([perms]),
      dm_permission: false,
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'id',
          description: 'The ID of the member to unban.',
          required: true
        }
      ]
    }

    super(sc)
  }

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    if (!interaction.memberPermissions?.has(perms)) {
      return {
        content: '❌ You do not have permission to use this command!',
        ephemeral: true
      }
    } else if (
      interaction.guild === null ||
      !interaction.guild.members.me ||
      !interaction.guild.members.me.permissions.has(perms)
    ) {
      return {
        content: '❌ I do not have full permissions in this guild, please re-invite with permission to ban members.',
        ephemeral: true
      }
    }

    const id = interaction.options.getString('id', true)

    if (!util.isSnowflake(id)) {
      return {
        content: '❌ The ID provided is not valid.',
        ephemeral: true
      }
    }

    try {
      await interaction.guild.bans.fetch(id)
    } catch (e) {
      const err = e as DiscordAPIError

      if (err.code === RESTJSONErrorCodes.UnknownBan) {
        return {
          content: '❌ Unknown ban.',
          ephemeral: true
        }
      }

      return {
        content: `❌ An unexpected error occurred: ${inlineCode(`[${err.code}]: ${err.message}`)}`,
        ephemeral: true
      }
    }

    const unban = await interaction.guild.bans.remove(
      id,
      `Unban requested by ${interaction.user.id} (${interaction.user.tag}).`
    ).catch(() => null)

    if (unban === null) {
      return {
        content: `❌ Couldn't unban ${inlineCode(id)}.`,
        ephemeral: true
      }
    }

    return {
      content: `✅ Unbanned ${unban} (${unban.tag} - ${inlineCode(unban.id)})`,
      ephemeral: true
    }
  }
}
