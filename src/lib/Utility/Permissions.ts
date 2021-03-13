import { Channel, GuildMember, PermissionFlags, PermissionResolvable, Permissions, Role } from 'discord.js';
import { isText, isVoice } from '../types/Discord.js.js';

/**
 * Check if a user or role has permissions in a channel.
 */
export const hasPerms = (
    channel: Channel, 
    userOrRole: GuildMember | Role, 
    perms: PermissionResolvable
) => {
    if (typeof channel === 'undefined' || channel === null)
        return false;
        
    if (!isText(channel) && !isVoice(channel))
        return true;

    return channel.permissionsFor(userOrRole).has(perms);
}

/**
 * Compares 2 guildmembers and checks if @see {a} is higher in the hierarchy than @see {b}
 * @see https://discord.js.org/#/docs/main/stable/class/Role?scrollTo=comparePositionTo
 * @see https://discord.js.org/#/docs/main/stable/class/GuildMember?scrollTo=manageable
 */
export const hierarchy = (
    a: GuildMember,
    b: GuildMember
) => {
    return a.guild.ownerID === a.id || // below check only checks the highest role
           a.roles.highest.comparePositionTo(b.roles.highest) > 0;
}

const PermEntry = Object.entries(Permissions.FLAGS);
export const permResolvableToString = (perms: PermissionResolvable) => {
    perms = Array.isArray(perms) ? perms : [perms];

    const permString = (perms as (bigint | keyof PermissionFlags)[])
        .map(perm => PermEntry.find(p => p[0] === perm || p[1] === perm).shift())
        .join('``, ``');

    return `\`\`${permString}\`\``;
}