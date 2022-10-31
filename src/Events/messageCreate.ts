import { KhafraClient } from '#khaf/Bot'
import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { cooldown } from '#khaf/cooldown/GlobalCooldown.js'
import { sql } from '#khaf/database/Postgres.js'
import { Event } from '#khaf/Event'
import { logger, loggerUtility } from '#khaf/structures/Logger.js'
import type { kGuild } from '#khaf/types/KhafraBot.js'
import { Embed, EmbedUtil } from '#khaf/utility/Constants/Embeds.js'
import { cwd } from '#khaf/utility/Constants/Path.js'
import { createFileWatcher } from '#khaf/utility/FileWatcher.js'
import { logError } from '#khaf/utility/Rejections.js'
import { Stats } from '#khaf/utility/Stats.js'
import { plural, upperCase } from '#khaf/utility/String.js'
import { stripIndents } from '#khaf/utility/Template.js'
import { Sanitize } from '#khaf/utility/util.js'
import { inlineCode } from '@discordjs/builders'
import { Attachment, DiscordAPIError, Events, Message, type MessageReplyOptions } from 'discord.js'
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
const disabled = typeof processArgs['disabled'] === 'string'
  ? processArgs['disabled'].split(',').map(c => c.toLowerCase())
  : []

export class kEvent extends Event<typeof Events.MessageCreate> {
  name = Events.MessageCreate as const

  async init (message: Message): Promise<void> {
    Stats.messages++

    if (!Sanitize(message)) return

    const [mention, name = '', ...args] = message.content.split(/\s+/g)
    const commandName = name.toLowerCase()

    if (
      mention !== `<@!${config.botId}>` &&
            mention !== `<@&${config.botId}>` &&
            mention !== `<@${config.botId}>`
    ) {
      return
    } else if (!KhafraClient.Commands.has(commandName)) {
      return
    }

    const command = KhafraClient.Commands.get(commandName)!
    // @PseudoBot say hello world -> hello world
    const content = message.content.slice(mention.length + name.length + 2)

    const interactionCache = message.client.application.commands.cache
    const appCommand = interactionCache.find(({ name }) => {
      return name === command.settings.name || !!command.settings.aliases?.includes(name)
    })

    if (appCommand !== undefined) {
      // TODO: use `chatInputApplicationCommandMention` from @discordjs/builders
      // once a new version (past v1.2.0) has been released.
      // https://github.com/discord/discord-api-docs/pull/5186/files
      const commandMention: `</${string}>` = command.appSuggestion
        ? command.appSuggestion(appCommand, { args, content, commandName })
        : `</${appCommand.name}:${appCommand.id}>`

      return void message.reply({
        content: stripIndents`
                Hey ${message.member ?? message.author}, use the slash command version instead!
                ${commandMention}
                `
      }).catch(logError)
    }

    let guild: kGuild | undefined

    if (command.init.length === 3) {
      const rows = await sql<[kGuild?]>`
        SELECT * 
        FROM kbGuild
        WHERE guild_id = ${message.guildId}::text
        LIMIT 1;
      `

      guild = rows[0]
    }

    // command cooldowns are based around the commands name, not aliases
    const limited = command.rateLimit.isRateLimited(message.author.id)

    if (limited) {
      if (command.rateLimit.isNotified(message.author.id)) return

      const cooldownInfo = command.rateLimit.get(message.author.id)!
      const rateLimitSeconds = command.rateLimit.rateLimitSeconds
      const delay = rateLimitSeconds - ((Date.now() - cooldownInfo.added) / 1_000)

      return void message.reply({
        content:
                    `${upperCase(command.settings.name)} has a ${rateLimitSeconds} second rate limit! ` +
                    `Please wait ${delay.toFixed(2)} second${plural(Number(delay.toFixed(2)))} to use this command again! ❤️`
      })
    } else if (disabled.includes(command.settings.name) || command.settings.aliases?.some(c => disabled.includes(c))) {
      return void message.reply({
        content: `${inlineCode(name)} is temporarily disabled!`
      })
    } else {
      command.rateLimit.rateLimitUser(message.author.id)
    }

    if (command.settings.ownerOnly && !Command.isBotOwner(message.author.id)) {
      return void message.reply({
        embeds: [
          Embed.error(`\`${command.settings.name}\` is only available to the bot owner!`)
        ]
      })
    }

    const [min, max = Infinity] = command.settings.args
    if (min > args.length || args.length > max) {
      return void message.reply({
        embeds: [
          Embed.error(`
          Incorrect number of arguments provided.

          The command requires ${min} minimum arguments and ${max} max.
          Example(s):
          ${command.help.slice(1).map(c => inlineCode(`${command.settings.name} ${c || '​'}`.trim())).join('\n')}
          `)
        ]
      })
    }

    if (!_cooldownUsers(message.author.id)) {
      return void message.reply({ embeds: [Embed.error('Users are limited to 10 commands a minute.')] })
    } else if (!_cooldownGuild(message.guild.id)) {
      return void message.reply({ embeds: [Embed.error('Guilds are limited to 30 commands a minute.')] })
    } else if (
      message.member === null ||
            !message.channel.permissionsFor(message.member).has(command.permissions)
    ) {
      return void message.reply({
        embeds: [
          Embed.perms(message.channel, message.member, command.permissions)
        ]
      })
    }

    Stats.session++

    try {
      const options: Arguments = { args, commandName, content }
      const returnValue = await command.init(message, options, guild)
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

      return void await message.reply(param)
    } catch (e) {
      logger.error(e, 'message event error')

      if (!(e instanceof Error)) {
        return
      } else if (e instanceof DiscordAPIError) {
        // if there's an error sending a message, we should probably
        // not send another message. in the future try figuring out
        // the error code and basing this check off of that.
        return
      }

      const error = 'An unexpected error has occurred!'

      return void message.reply({
        embeds: [Embed.error(error)],
        failIfNotExists: false
      })
    } finally {
      logger.info(loggerUtility.formatters.message(message), `message command ${command.settings.name}`)
    }
  }
}
