import { KhafraClient } from '#khaf/Bot'
import { Command, type Arguments } from '#khaf/Command'
import { cooldown } from '#khaf/cooldown/GlobalCooldown.js'
import { Event } from '#khaf/Event'
import { logger, loggerUtility } from '#khaf/structures/Logger.js'
import { Embed, EmbedUtil } from '#khaf/utility/Constants/Embeds.js'
import { cwd } from '#khaf/utility/Constants/Path.js'
import { createFileWatcher } from '#khaf/utility/FileWatcher.js'
import { Stats } from '#khaf/utility/Stats.js'
import { ChannelType } from 'discord-api-types/v10'
import { Attachment, DiscordAPIError, Events, Message, type MessageReplyOptions } from 'discord.js'
import { join } from 'node:path'

const cooldownUsers = cooldown(10, 60000)
const config = createFileWatcher<typeof import('../../config.json')>(
    join(cwd, 'config.json')
)

const defaultSettings = {
    max_warning_points: 20,
    mod_log_channel: null,
    welcome_channel: null
}

export class kEvent extends Event<typeof Events.MessageCreate> {
    name = Events.MessageCreate as const

    async init (message: Message): Promise<void> {
        if (message.channel.type !== ChannelType.DM) {
            return
        }

        const [mention, name, ...args] = message.content.split(/\s+/g)

        if (mention !== `<@!${config.botId}>` && mention !== `<@${config.botId}>`) {
            return
        } else if (!KhafraClient.Commands.has(name.toLowerCase())) {
            return
        }

        // !say hello world -> hello world
        const content = message.content.slice(mention.length + name.length + 2)
        const command = KhafraClient.Commands.get(name.toLowerCase())!

        if (!cooldownUsers(message.author.id)) { // user is rate limited
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
            const returnValue = await command.init(message, options, defaultSettings)

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

            if (!(e instanceof Error)) {
                return
            } else if (e instanceof DiscordAPIError) {
                // if there's an error sending a message, we should probably
                // not send another message. in the future try figuring out
                // the error code and basing this check off of that.
                return
            }

            return void await message.reply({
                embeds: [Embed.error('An unexpected error has occurred!')],
                failIfNotExists: false
            })
        } finally {
            logger.info({ message }, `handled DM (${command.settings.name})`)
        }
    }
}