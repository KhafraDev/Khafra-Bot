import { KhafraClient } from '#khaf/Bot'
import { MessagesLRU } from '#khaf/cache/Messages.js'
import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { sql } from '#khaf/database/Postgres.js'
import { Event } from '#khaf/Event'
import { logger, loggerUtility } from '#khaf/structures/Logger.js'
import type { kGuild, PartialGuild } from '#khaf/types/KhafraBot.js'
import { Embed, EmbedUtil } from '#khaf/utility/Constants/Embeds.js'
import { cwd } from '#khaf/utility/Constants/Path.js'
import { isDM } from '#khaf/utility/Discord.js'
import { Sanitize } from '#khaf/utility/Discord/SanitizeMessage.js'
import { createFileWatcher } from '#khaf/utility/FileWatcher.js'
import { Stats } from '#khaf/utility/Stats.js'
import { plural, upperCase } from '#khaf/utility/String.js'
import { inlineCode } from '@discordjs/builders'
import { Attachment, DiscordAPIError, Events, Message, type ReplyMessageOptions } from 'discord.js'
import { join } from 'node:path'
import { argv } from 'node:process'
import { parseArgs } from 'node:util'
import { _cooldownGuild, _cooldownUsers } from './messageCreate.js'

const config = createFileWatcher(
    {} as typeof import('../../config.json'),
    join(cwd, 'config.json')
)

const defaultSettings: PartialGuild = {
    max_warning_points: 20,
    mod_log_channel: null,
    welcome_channel: null
}

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

export class kEvent extends Event<typeof Events.MessageUpdate> {
    name = Events.MessageUpdate as const

    async init (oldMessage: Message<true>, newMessage: Message<true>): Promise<void> {
        Stats.messages++

        if (!MessagesLRU.has(oldMessage.id)) return
        if (oldMessage.content === newMessage.content) return
        if (!Sanitize(newMessage) || isDM(newMessage.channel)) return

        const [mention, name, ...args] = newMessage.content.split(/\s+/g)

        if (mention !== `<@!${config.botId}>` && mention !== `<@${config.botId}>`) {
            return
        } else if (!KhafraClient.Commands.has(name.toLowerCase())) {
            return
        }

        const command = KhafraClient.Commands.get(name.toLowerCase())!
        let guild!: typeof defaultSettings | kGuild

        if (command.init.length === 3) {
            const rows = await sql<[kGuild?]>`
                SELECT * 
                FROM kbGuild
                WHERE guild_id = ${newMessage.guildId}::text
                LIMIT 1;
            `

            if (rows.length !== 0) {
                guild = { ...defaultSettings, ...rows.shift() }
            } else {
                guild = { ...defaultSettings }
            }
        }

        // !say hello world -> hello world
        const content = newMessage.content.slice(mention.length + name.length + 2)

        // command cooldowns are based around the commands name, not aliases
        const limited = command.rateLimit.isRateLimited(newMessage.author.id)

        if (limited) {
            if (command.rateLimit.isNotified(newMessage.author.id)) return

            const cooldownInfo = command.rateLimit.get(newMessage.author.id)!
            const rateLimitSeconds = command.rateLimit.rateLimitSeconds
            const delay = rateLimitSeconds - ((Date.now() - cooldownInfo.added) / 1_000)

            return void newMessage.reply({
                content:
                    `${upperCase(command.settings.name)} has a ${rateLimitSeconds} second rate limit! ` +
                    `Please wait ${delay.toFixed(2)} second${plural(Number(delay.toFixed(2)))} to use this command again! ❤️`
            })
        } else if (disabled.includes(command.settings.name) || command.settings.aliases?.some(c => disabled.includes(c))) {
            return void newMessage.reply({
                content: `${inlineCode(name)} is temporarily disabled!`
            })
        } else {
            command.rateLimit.rateLimitUser(newMessage.author.id)
        }

        if (command.settings.ownerOnly && !Command.isBotOwner(newMessage.author.id)) {
            return void newMessage.reply({
                embeds: [
                    Embed.error(`\`${command.settings.name}\` is only available to the bot owner!`)
                ]
            })
        }

        const [min, max = Infinity] = command.settings.args
        if (min > args.length || args.length > max) {
            return void newMessage.reply({
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

        if (!_cooldownUsers(newMessage.author.id)) {
            return void newMessage.reply({ embeds: [Embed.error('Users are limited to 10 commands a minute.')] })
        } else if (!_cooldownGuild(newMessage.guild.id)) {
            return void newMessage.reply({ embeds: [Embed.error('Guilds are limited to 30 commands a minute.')] })
        } else if (
            newMessage.member === null ||
            !newMessage.channel.permissionsFor(newMessage.member).has(command.permissions)
        ) {
            return void newMessage.reply({
                embeds: [
                    Embed.perms(newMessage.channel, newMessage.member, command.permissions)
                ]
            })
        }

        Stats.session++

        try {
            const options: Arguments = { args, commandName: name.toLowerCase(), content }
            const returnValue = await command.init(newMessage, options, guild)
            if (!returnValue || returnValue instanceof Message)
                return

            const param = {
                failIfNotExists: false
            } as ReplyMessageOptions

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

            return void await newMessage.reply(param)
        } catch (e) {
            logger.error(e, 'message update error')

            if (!(e instanceof Error)) {
                return
            } else if (e instanceof DiscordAPIError) {
                // if there's an error sending a message, we should probably
                // not send another message. in the future try figuring out
                // the error code and basing this check off of that.
                return
            }

            const error = 'An unexpected error has occurred!'

            return void newMessage.reply({
                embeds: [Embed.error(error)],
                failIfNotExists: false
            })
        } finally {
            MessagesLRU.delete(newMessage.id)

            logger.info({
                oldMessage: loggerUtility.formatters.message(oldMessage),
                newMessageId: newMessage.id
            }, `message update command (${command.settings.name})`)
        }
    }
}