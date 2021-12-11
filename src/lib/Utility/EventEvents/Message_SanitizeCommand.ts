import { Message, Permissions } from 'discord.js';
import { hasPerms } from '../Permissions.js';

const basic = new Permissions([
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.EMBED_LINKS,
    Permissions.FLAGS.VIEW_CHANNEL
]);

/**
 * Check message for required criteria.
 * @param message 
 */
export const Sanitize = (message: Message): message is Message<true> => {
    if (
        message.webhookId || // author is null in webhook messages
        message.author.bot ||
        !['DEFAULT', 'REPLY'].includes(message.type) ||
        (message.guild && !message.guild.available) ||
        message.system ||
        message.partial ||
        message.tts || 
        message.content.length === 0 ||
        !message.guild
    ) { 
        return false;
    }

    return hasPerms(message.channel, message.guild.me, basic);
}