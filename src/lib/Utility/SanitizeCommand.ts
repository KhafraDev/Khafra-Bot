import { 
    Message, 
    Permissions
} from "discord.js";
import { isText } from '../types/Discord.js.js';

const basic = new Permissions([
    'SEND_MESSAGES',
    'EMBED_LINKS',
    'VIEW_CHANNEL',
    'READ_MESSAGE_HISTORY'
]);

/**
 * Check message for required criteria.
 * @param message 
 */
export const Sanitize = (message: Message) => {
    if(message.webhookID) { // author is null in webhook messages
        return false;
    } else if(message.author.bot) {
        return false;
    } else if(message.type !== 'DEFAULT') {
        return false;
    } else if(message.guild && !message.guild.available) {
        return false;
    } else if(message.system) {
        return false;
    } else if(message.partial) {
        return false;
    } else if(message.tts) {
        return false;
    }

    if(isText(message.channel)) {
        const perms = message.guild.me.permissions;
        const channelPerms = message.channel.permissionsFor(message.guild.me);
        if(perms.has(Permissions.FLAGS.ADMINISTRATOR)) { // Admin perms = has all perms.
            return true;
        } else if(
            !perms.has(basic) ||     // guild perms
            !channelPerms.has(basic) // channel perms
        ) {
            return false;
        }
    }

    return true;
}