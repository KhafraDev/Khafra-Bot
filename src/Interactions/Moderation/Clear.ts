import { Interactions } from '#khaf/Interaction'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { isText, isThread } from '#khaf/utility/Discord.js'
import * as util from '#khaf/utility/util.js'
import { toString } from '#khaf/utility/Permissions.js'
import { bold, time } from '@discordjs/builders'
import type {
  RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10'
import {
  ApplicationCommandOptionType,
  ChannelType,
  PermissionFlagsBits
} from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { setTimeout } from 'node:timers/promises'

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'clear',
      description: 'Bulk deletes messages from a channel.',
      default_member_permissions: toString([PermissionFlagsBits.ManageMessages]),
      dm_permission: false,
      options: [
        {
          type: ApplicationCommandOptionType.Integer,
          name: 'messages',
          description: 'Number of messages to clear.',
          required: true,
          min_value: 1,
          max_value: 100
        },
        {
          type: ApplicationCommandOptionType.Channel,
          name: 'channel',
          description: 'The channel to delete the messages from (defaults to the current channel).',
          channel_types: [
            ChannelType.GuildText,
            ChannelType.GuildAnnouncement,
            ChannelType.AnnouncementThread,
            ChannelType.PublicThread,
            ChannelType.PrivateThread
          ]
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

    const amount = interaction.options.getInteger('messages', true)
    const channel = interaction.options.getChannel('channel') ?? interaction.channel

    if (!isText(channel) && !isThread(channel)) {
      return {
        content: `❌ I can't bulk delete messages in ${channel}!`,
        ephemeral: true
      }
    } else if (!channel.permissionsFor(interaction.guild.members.me).has(defaultPerms)) {
      return {
        content: '❌ Re-invite the bot with the correct permissions to use this command!',
        ephemeral: true
      }
    }

    await interaction.reply({
      content: `✅ Deleting ${amount} messages in ${channel} in a few seconds!`,
      ephemeral: true
    })
    await setTimeout(5_000)
    await interaction.deleteReply()
    await channel.bulkDelete(amount)

    // If the channel is private, we shouldn't broadcast
    // information about it.

    const everyone = channel.guild.roles.everyone.id

    if (channel.permissionsFor(everyone)?.has(PermissionFlagsBits.ViewChannel)) {
      const embed = Embed.json({
        color: colors.ok,
        description: `
          ${bold('Channel:')} ${channel}
          ${bold('Messages:')} ${amount}
          ${bold('Staff:')} ${interaction.user}
          ${bold('Time:')} ${time(new Date())}`,
        title: 'Channel Messages Cleared'
      })

      return void util.postToModLog(interaction, [embed])
    }
  }
}
