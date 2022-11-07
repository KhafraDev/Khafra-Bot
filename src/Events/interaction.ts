import { KhafraClient } from '#khaf/Bot'
import { Command } from '#khaf/Command'
import { Event } from '#khaf/Event'
import { logger, loggerUtility } from '#khaf/structures/Logger.js'
import { upperCase } from '#khaf/utility/String.js'
import { bold, inlineCode } from '@discordjs/builders'
import {
  Events,
  type Interaction,
  type ChatInputCommandInteraction,
  type InteractionReplyOptions,
  type MessageContextMenuCommandInteraction,
  type UserContextMenuCommandInteraction
} from 'discord.js'
import { argv } from 'node:process'
import { parseArgs } from 'node:util'

type Interactions =
  ChatInputCommandInteraction &
  MessageContextMenuCommandInteraction &
  UserContextMenuCommandInteraction

const { values: processArgs } = parseArgs({
  args: argv.slice(2),
  strict: false,
  options: {
    disabled: {
      type: 'string'
    }
  }
})
const disabled = typeof processArgs['disabled'] === 'string'
  ? processArgs['disabled'].split(',').map(c => c.toLowerCase())
  : []

export class kEvent extends Event<typeof Events.InteractionCreate> {
  name = Events.InteractionCreate as const

  async init (interaction: Interaction): Promise<void> {
    if (
      !interaction.isChatInputCommand() &&
            !interaction.isContextMenuCommand()
    ) {
      return
    }

    const command = interaction.isContextMenuCommand()
      ? KhafraClient.Interactions.Context.get(interaction.commandName)
      : KhafraClient.Interactions.Commands.get(interaction.commandName)

    if (!command) {
      return void interaction.reply({
        content: '❌ This command is no longer available, try to refresh your client!'
      })
    } else if (command.options.ownerOnly && !Command.isBotOwner(interaction.user.id)) {
      return void interaction.reply({
        content: `${upperCase(command.data.name)} is ${bold('only')} available to the bot owner!`
      })
    } else if (disabled.includes(interaction.commandName)) {
      return void interaction.reply({
        content: `${inlineCode(interaction.commandName)} is temporarily disabled!`
      })
    }

    try {
      if (command.options.defer)
        await interaction.deferReply()

      const result = await command.init(interaction as Interactions)
      const param: InteractionReplyOptions = {}

      if (interaction.replied) {
        return
      } else if (result == null) {
        const type = Object.prototype.toString.call(result)
        param.content = `❓ Received an invalid type from this response: ${inlineCode(type)}`
        param.ephemeral = true
      } else {
        Object.assign(param, result)
      }

      if (command.options.replyOpts)
        Object.assign(param, command.options.replyOpts)

      if (interaction.deferred)
        return void await interaction.editReply(param)

      return void await interaction.reply(param)
    } catch (e) {
      logger.error(e, `interaction error (${interaction.commandName})`)
    } finally {
      loggerUtility.logInteraction(interaction, command.data.name)
    }
  }
}
