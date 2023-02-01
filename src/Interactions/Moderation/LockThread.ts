import { Interactions } from '#khaf/Interaction'
import { toString } from '#khaf/utility/Permissions.js'
import {
  ApplicationCommandOptionType,
  ChannelType,
  PermissionFlagsBits, Routes,
  type RESTPatchAPIChannelJSONBody,
  type RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'lock-thread',
      description: 'Easier way of archiving a thread.',
      default_member_permissions: toString([PermissionFlagsBits.ManageThreads]),
      dm_permission: false,
      options: [
        {
          type: ApplicationCommandOptionType.Channel,
          name: 'thread',
          description: 'The thread to lock.'
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'reason',
          description: 'An optional reason to show in audit logs.'
        }
      ]
    }

    super(sc)
  }

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
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
        content: '❌ I do not have full permissions in this guild, please re-invite with permission to manage channels.',
        ephemeral: true
      }
    }

    const thread = interaction.options.getChannel('thread') ?? interaction.channel

    if (
      thread?.type !== ChannelType.PublicThread &&
            thread?.type !== ChannelType.PrivateThread
    ) {
      const message = thread === null
        ? '❌ I\'m unsure what channel you are in, try putting it as an option instead.'
        : `❌ ${thread} is not a forum channel.`

      return {
        content: message,
        ephemeral: true
      }
    }

    const reason =
            interaction.options.getString('reason') ??
            `Lock requested by ${interaction.user.tag} (${interaction.user.id})`

    const body: RESTPatchAPIChannelJSONBody = {
      locked: true,
      archived: true
    }

    const message = `thread ${thread} (${thread.id})`

    await interaction.reply({
      content: `Locking ${message}...`
    })

    const response = await interaction.client.rest.patch(
      Routes.channel(thread.id),
      {
        body,
        headers: { 'X-Audit-Log-Reason': reason }
      }
    ).catch(() => null)

    if (response === null) {
      await interaction.editReply({
        content: '❌ I was unable to lock the thread.'
      })
    } else {
      await interaction.editReply({
        content: `✅ Locked ${message}!`
      })
    }
  }
}
