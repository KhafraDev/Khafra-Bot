import { KhafraClient } from '#khaf/Bot'
import { InteractionSubCommand } from '#khaf/Interaction'
import { cwd } from '#khaf/utility/Constants/Path.js'
import { createFileWatcher } from '#khaf/utility/FileWatcher.js'
import { inlineCode } from '@discordjs/builders'
import type { APIApplicationCommand } from 'discord-api-types/v10'
import { Routes } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { join } from 'node:path'

const config = createFileWatcher<typeof import('../../../../config.json')>(
  join(cwd, 'config.json')
)

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'interaction',
      name: 'delete'
    })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const commandName = interaction.options.getString('command-name', true)
    const command = KhafraClient.Interactions.Commands.get(commandName.toLowerCase())
    const globally = interaction.options.getBoolean('globally')

    if (!command) {
      return {
        content: `❌ Command "${inlineCode(commandName)}" does not exist, idiot.`,
        ephemeral: true
      }
    } else if (!interaction.guild) {
      return {
        content: '❌ Not in a guild.',
        ephemeral: true
      }
    }

    if (globally !== true) {
      const commands = await interaction.client.rest.get(
        Routes.applicationGuildCommands(config.botId, config.guildId)
      ) as APIApplicationCommand[]
      const commandId = commands.find(c => c.name === command.data.name)

      if (!commandId) {
        return {
          content: '❌ Command doesn\'t exist in the guild.',
          ephemeral: true
        }
      }

      // https://discord.com/developers/docs/interactions/application-commands#delete-guild-application-command
      await interaction.client.rest.delete(
        Routes.applicationGuildCommand(config.botId, config.guildId, commandId.id)
      )
    } else {
      const commands = await interaction.client.rest.get(
        Routes.applicationCommands(config.botId)
      ) as APIApplicationCommand[]

      const commandId = commands.find(c => c.name === command.data.name)

      if (!commandId) {
        return {
          content: '❌ Command doesn\'t exist.',
          ephemeral: true
        }
      }

      // https://discord.com/developers/docs/interactions/application-commands#delete-global-application-command
      await interaction.client.rest.delete(
        Routes.applicationCommand(config.botId, commandId.id)
      )
    }

    return {
      content: `✅ Command "${inlineCode(commandName)}" has been deleted!`
    }
  }
}
