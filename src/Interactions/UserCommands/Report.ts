import { InteractionUserCommand } from '#khaf/Interaction'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { isGuildTextBased } from '#khaf/utility/Discord.js'
import * as util from '#khaf/utility/util.js'
import { codeBlock, hideLinkEmbed, hyperlink } from '@discordjs/builders'
import {
  ApplicationCommandType,
  PermissionFlagsBits,
  type RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10'
import type { InteractionReplyOptions, MessageContextMenuCommandInteraction } from 'discord.js'
import { argv } from 'node:process'
import { parseArgs } from 'node:util'

const { values: args } = parseArgs({
  args: argv.slice(2),
  options: {
    dev: {
      type: 'boolean'
    }
  }
})
const isDev = args['dev'] === true

const perms =
  PermissionFlagsBits.SendMessages |
  PermissionFlagsBits.ViewChannel |
  PermissionFlagsBits.EmbedLinks

export class kUserCommand extends InteractionUserCommand {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'Report Message',
      type: ApplicationCommandType.Message
    }

    super(sc, {
      defer: true
    })
  }

  async init (interaction: MessageContextMenuCommandInteraction): Promise<InteractionReplyOptions | void> {
    const settings = await util.interactionGetGuildSettings(interaction)

    if (!settings?.staffChannel) {
      return {
        content: '❌ The staff channel hasn\'t been setup in the guild yet, ask an admin to set it up!',
        ephemeral: true
      }
    }

    const channel = await (interaction.guild ?? interaction.client).channels
      .fetch(settings.staffChannel)
      .catch(() => null)
    const { content, author, id, attachments } = interaction.targetMessage

    if (isDev === false) {
      if (author.id === interaction.user.id) {
        return {
          content: '❌ You cannot report your own message.',
          ephemeral: true
        }
      } else if (author.bot === true) {
        return {
          content: '❌ You cannot report messages from bots.',
          ephemeral: true
        }
      }
    }

    const channelId = interaction.targetMessage.channelId
    const messageURL = `https://discord.com/channels/${interaction.guildId ?? '@me'}/${channelId}/${id}`

    if (!channel) {
      return {
        content: '❌ No staff channel could be found, was it deleted or were my perms taken away?',
        ephemeral: true
      }
    } else if (!isGuildTextBased(channel)) {
      return {
        content: '❌ I can only send messages in text based channels, sorry!',
        ephemeral: true
      }
    } else if (
      interaction.guild === null ||
      interaction.guild.members.me === null ||
      !channel.permissionsFor(interaction.guild.members.me).has(perms)
    ) {
      return {
        content: '❌ I cannot send the message to staff, please contact an admin to correct this!',
        ephemeral: true
      }
    }

    const m = `<@${author.id}>'s ${hyperlink('message', hideLinkEmbed(messageURL))}`
    const a = attachments.size === 0 ? undefined : [...attachments.values()]

    const embed = Embed.json({
      color: colors.ok,
      author: { name: interaction.user.tag, icon_url: interaction.user.displayAvatarURL() },
      title: 'Message Reported!',
      description: `
        ${interaction.user} reported ${m}:

        ${content.length !== 0 ? codeBlock(content) : ''}`
    })

    await channel.send({
      content: a !== undefined
        ? a.map(att => att.proxyURL).join('\n')
        : undefined,
      embeds: [embed]
    })

    // Context menu replies cannot be ephemeral, but you can send a
    // normal reply, delete it, and then follow up to the interaction
    // with an ephemeral message. This sucks, but Discord explicitly
    // doesn't want to allow ephemeral context menu replies.
    await interaction.editReply({
      content: '✅ Reported the message to staff!'
    })
    await interaction.deleteReply()
    await interaction.followUp({
      content: `Reported ${m}!`,
      ephemeral: true
    })
  }
}
