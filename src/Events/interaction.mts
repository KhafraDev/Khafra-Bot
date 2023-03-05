import { KhafraClient } from '#khaf/Bot'
import { Command } from '#khaf/Command'
import type { Event } from '#khaf/Event'
import { handleReport } from '#khaf/functions/case/reports.mjs'
import { logger, loggerUtility } from '#khaf/structures/Logger.mjs'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { validSnowflake } from '#khaf/utility/Mentions.mjs'
import { hierarchy } from '#khaf/utility/Permissions.mjs'
import { upperCase } from '#khaf/utility/String.mjs'
import { bold, inlineCode } from '@discordjs/builders'
import type { APIEmbed } from 'discord-api-types/v10'
import {
  Events,
  type AutocompleteInteraction,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type Interaction,
  type InteractionReplyOptions,
  type MessageContextMenuCommandInteraction,
  type Role,
  type UserContextMenuCommandInteraction
} from 'discord.js'
import assert from 'node:assert'
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
const disabled = typeof processArgs.disabled === 'string'
  ? processArgs.disabled.split(',').map(c => c.toLowerCase())
  : []

export class kEvent implements Event {
  name = Events.InteractionCreate as const

  async init (interaction: Interaction): Promise<void> {
    if (interaction.isButton()) {
      if (interaction.customId.startsWith('report::')) {
        assert(interaction.inGuild())
        return await handleReport(interaction)
      } else if (
        interaction.inCachedGuild() &&
        interaction.customId.startsWith('react-role') ||
        (
          validSnowflake(interaction.customId) && // the id used to just be a snowflake
          interaction.message.author.id === interaction.client.user.id
        )
      ) {
        return this.reactRole(interaction as ButtonInteraction<'cached'>)
      }

      return
    } else if (interaction.isAutocomplete()) {
      return this.autoComplete(interaction)
    }

    if (
      !interaction.isChatInputCommand() &&
      !interaction.isContextMenuCommand()
    ) {
      return
    }

    return this.command(interaction)
  }

  async command (
    interaction:
      | ChatInputCommandInteraction
      | MessageContextMenuCommandInteraction
      | UserContextMenuCommandInteraction
  ): Promise<void> {
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

      if (!interaction.replied) {
        const options = {
          content: 'Something unexpected happened, the problem will be fixed soon. 😦',
          ephemeral: true
        } as const

        if (interaction.deferred)
          return void await interaction.editReply(options)

        return void await interaction.reply(options)
      }
    } finally {
      loggerUtility.logInteraction(interaction, command.data.name)
    }
  }

  async reactRole (interaction: ButtonInteraction<'cached'>): Promise<void> {
    const { guild, member, customId } = interaction

    let action = 'default'
    // old react-roles set the customId as the role id
    let roleId = interaction.customId

    if (customId.startsWith('react-role,')) {
      // react-role,action,roleId
      const split = interaction.customId.split(',')

      action = split[1]
      roleId = split[2]
    }

    const role = await guild.roles.fetch(roleId).catch(() => null)

    if (role !== null) {
      loggerUtility.logRole(role, 'react role', {
        ...loggerUtility.formatters.guild(guild),
        ...loggerUtility.formatters.user(interaction.user)
      })
    }

    if (role === null) {
      return void await interaction.reply({
        content: '❌ This role isn\'t cached or has been deleted.',
        ephemeral: true
      })
    } else if (!guild.members.me || !hierarchy(guild.members.me, member, false)) {
      return void await interaction.reply({
        content: '❌ I do not have permission to manage your roles!',
        ephemeral: true
      })
    }

    try {
      const had = member.roles.cache.has(role.id)
      const opts = { ephemeral: true, embeds: [] as APIEmbed[] } as const

      const add = async (role: Role): Promise<void> => {
        await member.roles.add(role)
        opts.embeds.push(Embed.ok(`Granted you the ${role} role!`))
      }

      const remove = async (role: Role): Promise<void> => {
        await member.roles.remove(role)
        opts.embeds.push(Embed.ok(`Removed role ${role} from you!`))
      }

      if (action === 'add') {
        if (had) {
          opts.embeds.push(Embed.ok('This role can only be added, and you already have it.'))
        } else {
          await add(role)
        }
      } else if (action === 'remove') {
        if (!had) {
          opts.embeds.push(Embed.ok('This role can only be removed, and you don\'t have it.'))
        } else {
          await remove(role)
        }
      } else {
        if (had) {
          await remove(role)
        } else {
          await add(role)
        }
      }

      return void await interaction.reply(opts)
    } catch (e) {
      logger.error(e, 'react role error')

      return void await interaction.reply({
        embeds: [
          Embed.error('An error prevented me from granting you the role!')
        ],
        ephemeral: true
      })
    }
  }

  async autoComplete (interaction: AutocompleteInteraction): Promise<void> {
    const autocomplete = interaction.options.getFocused(true)
    const handler = KhafraClient.Interactions.Autocomplete.get(
      `${interaction.commandName}-${autocomplete.name}`
    )

    return handler?.handle(interaction)
  }
}
