import { 
    Message, 
    Permissions
} from "discord.js";
import { isText } from '../types/Discord.js.js';
import { hasPerms } from "./Permissions.js";

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
    if (
        message.webhookID || // author is null in webhook messages
        message.author.bot ||
        message.type !== 'DEFAULT' ||
        (message.guild && !message.guild.available) ||
        message.system ||
        message.partial ||
        message.tts
    ) { 
        return false;
    }

    if (isText(message.channel))
        return hasPerms(message.channel, message.guild.me, basic);
    
    return true;
}