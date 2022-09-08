import { ChannelType, MessageType, PermissionFlagsBits } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

const basic =
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.EmbedLinks

/**
 * Check message for required criteria.
 * @param message
 */
export const Sanitize = (message: Message): message is Message<true> => {
    if (
        message.webhookId || // author is null in webhook messages
        message.author.bot ||
        (message.type !== MessageType.Default && message.type !== MessageType.Reply) ||
        message.system ||
        message.tts ||
        message.content.length === 0 ||
        !message.guild?.available
    ) {
        return false
    }

    const { channel, guild } = message
    const self = guild.members.me

    if (channel.type === ChannelType.DM) {
        return true
    }

    if (self === null) {
        return false
    }

    return channel.permissionsFor(self).has(basic)
}