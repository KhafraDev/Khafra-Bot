import { Message, Permissions } from "discord.js";

/**
 * Check message for required criteria.
 * @param message 
 */
export function Sanitize(message: Message) {
    if(message.author.bot) {
        return false;
    } else if(message.guild && !message.guild.available) {
        return false;
    } else if(message.system) {
        return false;
    } else if(message.partial) {
        return false;
    }

    if(message.channel.type === 'text') {
        const perms = message.guild.me.permissions;
        const channelPerms = message.channel.permissionsFor(message.guild.me);
        if(perms.has(Permissions.FLAGS.ADMINISTRATOR)) { // Admin perms = has all perms.
            return true;
        } else if(
            !perms.has(Permissions.FLAGS.SEND_MESSAGES)         || // guild perms
            !perms.has(Permissions.FLAGS.EMBED_LINKS)           || // guild perms
            !perms.has(Permissions.FLAGS.VIEW_CHANNEL)          || // guild perms
            !channelPerms.has(Permissions.FLAGS.SEND_MESSAGES)  || // channel perms
            !channelPerms.has(Permissions.FLAGS.EMBED_LINKS)    || // channel perms
            !channelPerms.has(Permissions.FLAGS.VIEW_CHANNEL)      // channel perms
        ) {
            return false;
        }
    }

    return true;
}