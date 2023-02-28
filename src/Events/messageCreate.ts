import { KhafraClient } from '#khaf/Bot'
import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { cooldown } from '#khaf/cooldown/GlobalCooldown.js'
import type { Event } from '#khaf/Event'
import { logger, loggerUtility } from '#khaf/structures/Logger.js'
import type { kGuild } from '#khaf/types/KhafraBot.js'
import { colors, Embed, EmbedUtil } from '#khaf/utility/Constants/Embeds.js'
import { cwd } from '#khaf/utility/Constants/Path.js'
import { isGuildTextBased } from '#khaf/utility/Discord.js'
import { createFileWatcher } from '#khaf/utility/FileWatcher.js'
import { seconds } from '#khaf/utility/ms.js'
import { Stats } from '#khaf/utility/Stats.js'
import { plural, upperCase } from '#khaf/utility/String.js'
import { stripIndents } from '#khaf/utility/Template.js'
import { guildSettings as getGuildSettings, Sanitize } from '#khaf/utility/util.js'
import { chatInputApplicationCommandMention, inlineCode } from '@discordjs/builders'
import { ChannelType } from 'discord-api-types/v10'
import { Attachment, Events, Message, type MessageReplyOptions } from 'discord.js'
import { join } from 'node:path'
import { argv } from 'node:process'
import { parseArgs } from 'node:util'

const config = createFileWatcher<typeof import('../../config.json')>(
  join(cwd, 'config.json')
)

const _cooldownGuild = cooldown(30, 60000)
const _cooldownUsers = cooldown(10, 60000)

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
  name = Events.MessageCreate as const

  async init (message: Message): Promise<void> {
    Stats.messages++

    if (message.channel.type === ChannelType.DM) {
      return this.dm(message)
    }

    if (Sanitize(message)) {
      return this.guild(message)
    }
  }

  async guild (message: Message<true>): Promise<void> {
    const { client, content: messageContent, member, author, guildId, channel, guild } = message

    const [mention, name = '', ...args] = messageContent.split(/\s+/g)
    const commandName = name.toLowerCase()
    const botManagedRole = guild.roles.botRoleFor(message.client.user)

    if (
      mention !== `<@!${config.botId}>` &&
      mention !== `<@${config.botId}>` &&
      (botManagedRole && mention !== botManagedRole.toString())
    ) {
      return
    }

    // @PseudoBot say hello world -> hello world
    const content = messageContent.slice(mention.length + name.length + 2)

    const interactionCache = client.application.commands.cache
    const appCommand = interactionCache.find(({ name }) => name === commandName)

    if (appCommand !== undefined) {
      const commandMention = chatInputApplicationCommandMention(appCommand.name, appCommand.id)

      return void message.reply({
        content: stripIndents`
          Hey ${member ?? author}, use the slash command version instead!
          ${commandMention}
          `
      })
    }

    if (!KhafraClient.Commands.has(commandName)) {
      return
    }

    const command = KhafraClient.Commands.get(commandName)!
    const { settings, rateLimit, help, permissions } = command

    let guildSettings: kGuild | undefined

    if (command.init.length === 3) {
      const item = await getGuildSettings(guildId)

      guildSettings = item as kGuild
    }

    // command cooldowns are based around the commands name, not aliases
    const limited = rateLimit.isRateLimited(author.id)

    if (limited) {
      if (rateLimit.isNotified(author.id)) return

      const cooldownInfo = rateLimit.get(author.id)!
      const rateLimitSeconds = rateLimit.rateLimitSeconds
      const delay = rateLimitSeconds - ((Date.now() - cooldownInfo.added) / seconds(1))

      return void message.reply({
        content:
          `${upperCase(settings.name)} has a ${rateLimitSeconds} second rate limit! ` +
          `Please wait ${delay.toFixed(2)} second${plural(Number(delay.toFixed(2)))} to use this command again! ❤️`
      })
    } else if (disabled.includes(settings.name) || settings.aliases?.some(c => disabled.includes(c))) {
      return void message.reply({
        content: `${inlineCode(name)} is temporarily disabled!`
      })
    } else {
      rateLimit.rateLimitUser(author.id)
    }

    if (settings.ownerOnly && !Command.isBotOwner(author.id)) {
      return void message.reply({
        embeds: [
          Embed.error(`\`${settings.name}\` is only available to the bot owner!`)
        ]
      })
    }

    const [min, max = Infinity] = settings.args

    if (min > args.length || args.length > max) {
      const helpMessage = help.length < 2
        ? [...help, ...Array<string>(2 - help.length).fill('')]
        : help

      return void message.reply({
        embeds: [
          Embed.error(`
          Incorrect number of arguments provided.

          The command requires ${min} minimum arguments and ${max} max.
          Example(s):
          ${helpMessage.slice(1).map(c => inlineCode(`${settings.name} ${c || '\u200B'}`.trim())).join('\n')}
          `)
        ]
      })
    }

    if (!_cooldownUsers(author.id)) {
      return void message.reply({ embeds: [Embed.error('Users are limited to 10 commands a minute.')] })
    } else if (!_cooldownGuild(guildId)) {
      return void message.reply({ embeds: [Embed.error('Guilds are limited to 30 commands a minute.')] })
    } else if (
      member === null ||
      !channel.permissionsFor(member).has(permissions)
    ) {
      return void message.reply({
        embeds: [
          Embed.perms(channel, member, permissions)
        ]
      })
    }

    Stats.session++

    try {
      const options: Arguments = { args, commandName, content }
      const returnValue = await command.init(message, options, guildSettings)
      if (!returnValue || returnValue instanceof Message)
        return

      const param: MessageReplyOptions = {
        failIfNotExists: false
      }

      if (typeof returnValue === 'string') {
        param.content = returnValue
      } else if (returnValue instanceof Attachment) {
        param.files = [returnValue]
      } else if (typeof returnValue === 'object') { // MessageOptions
        if (EmbedUtil.isAPIEmbed(returnValue)) {
          param.embeds = [returnValue]
        } else {
          Object.assign(param, returnValue)
        }
      }

      if (settings.send && isGuildTextBased(message.channel)) {
        return void await message.channel.send(param)
      }

      return void await message.reply(param)
    } catch (e) {
      logger.error(e, 'message event error')

      return void await message.reply({
        embeds: [
          Embed.json({
            color: colors.error,
            description: `Sorry ${member}, there was an issue running this command.`
          })
        ],
        failIfNotExists: false
      })
    } finally {
      logger.info(loggerUtility.formatters.message(message), `message command ${settings.name}`)
    }
  }

  async dm (message: Message): Promise<void> {
    const [mention, name, ...args] = message.content.split(/\s+/g)

    if (mention !== `<@!${config.botId}>` && mention !== `<@${config.botId}>`) {
      return
    } else if (!KhafraClient.Commands.has(name.toLowerCase())) {
      return
    }

    // !say hello world -> hello world
    const content = message.content.slice(mention.length + name.length + 2)
    const command = KhafraClient.Commands.get(name.toLowerCase())!

    if (!_cooldownUsers(message.author.id)) { // user is rate limited
      return void await message.reply({
        embeds: [
          Embed.error('Users are limited to 10 commands a minute.')
        ]
      })
    } else if (command.settings.ownerOnly && !Command.isBotOwner(message.author.id)) {
      return void await message.reply({
        embeds: [
          Embed.error(`\`${command.settings.name}\` is only available to the bot owner!`)
        ]
      })
    } else if (command.settings.guildOnly) {
      return void await message.reply({
        embeds: [
          Embed.error('This command is only available in guilds!')
        ]
      })
    }

    const options: Arguments = { args, commandName: name.toLowerCase(), content }
    Stats.session++

    try {
      const returnValue = await command.init(message, options, {})

      if (!returnValue || returnValue instanceof Message) {
        return
      }

      const param: MessageReplyOptions = {
        failIfNotExists: false
      }

      if (typeof returnValue === 'string') {
        param.content = returnValue
      } else if (returnValue instanceof Attachment) {
        param.files = [returnValue]
      } else if (typeof returnValue === 'object') { // MessageOptions
        if (EmbedUtil.isAPIEmbed(returnValue)) {
          param.embeds = [returnValue]
        } else {
          Object.assign(param, returnValue)
        }
      }

      return void await message.reply(param)
    } catch (e) {
      logger.error({
        error: e,
        ...loggerUtility.formatters.message(message)
      }, 'DM error')

      return void await message.reply({
        embeds: [
          Embed.json({
            color: colors.error,
            description: `Sorry ${message.author}, there was an issue running this command.`
          })
        ],
        failIfNotExists: false
      })
    } finally {
      logger.info({ message }, `handled DM (${command.settings.name})`)
    }
  }
}
