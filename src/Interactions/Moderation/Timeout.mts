import { Interactions } from '#khaf/Interaction'
import { days, hours, minutes, weeks } from '#khaf/utility/ms.mjs'
import { bitfieldToString } from '#khaf/utility/Permissions.mjs'
import {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
  RESTJSONErrorCodes,
  type RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, DiscordAPIError, InteractionReplyOptions } from 'discord.js'

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'timeout',
      description: 'Timeout a member from the guild.',
      default_member_permissions: bitfieldToString([PermissionFlagsBits.ModerateMembers]),
      dm_permission: false,
      options: [
        {
          type: ApplicationCommandOptionType.User,
          name: 'user',
          description: 'The user to timeout.',
          required: true
        },
        {
          type: ApplicationCommandOptionType.Integer,
          name: 'duration',
          description: 'Pre-set times.',
          required: true,
          choices: [
            { name: '60 secs', value: minutes(1) },
            { name: '5 mins',  value: minutes(5) },
            { name: '10 mins', value: minutes(10) },
            { name: '1 hour',  value: hours(1) },
            { name: '1 day',   value: days(1) },
            { name: '1 week',  value: weeks(1) },
            { name: '2 weeks', value: weeks(2) },
            { name: '3 weeks', value: weeks(3) },
            { name: '4 weeks', value: weeks(4) }
          ]
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'reason',
          description: 'The reason for timing out this member (displays in mod log).'
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
    } else if (
      interaction.guild === null ||
      !interaction.guild.members.me ||
      !interaction.guild.members.me.permissions.has(defaultPerms)
    ) {
      return {
        content:
          '❌ I do not have full permissions in this guild, please re-invite with permission to moderate members.',
        ephemeral: true
      }
    }

    const ms = interaction.options.getInteger('duration', true)
    const user = interaction.options.getUser('user', true)

    try {
      await interaction.guild.members.edit(
        user,
        {
          communicationDisabledUntil: Date.now() + ms,
          reason: interaction.options.getString('reason') ?? undefined
        }
      )
    } catch (e) {
      if ((e as DiscordAPIError).code === RESTJSONErrorCodes.MissingPermissions) {
        return {
          content: `I do not have permission to time out ${user}!`,
          ephemeral: true
        }
      }

      return {
        content: `An error occurred timing out ${user}!`,
        ephemeral: true
      }
    }

    return {
      content: `Timed out ${user}!`,
      ephemeral: true
    }
  }
}
