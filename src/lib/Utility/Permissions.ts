import { GuildMember, PermissionResolvable, Permissions, Role } from 'discord.js';
import { inlineCode } from '@khaf/builders';
import { isText, isVoice } from '../types/Discord.js.js';

/**
 * Check if a user or role has permissions in a channel.
 */
export const hasPerms = (
    channel: unknown, 
    userOrRole: unknown, 
    perms: PermissionResolvable
) => {
    if (typeof channel === 'undefined' || channel === null)
        return false;
    if (!isText(channel) && !isVoice(channel))
        return true;
    if (!(userOrRole instanceof GuildMember) && !(userOrRole instanceof Role))
        return false;

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
    return a.guild.ownerId === a.id || // below check only checks the highest role
           a.roles.highest.comparePositionTo(b.roles.highest) > 0;
}

export const permResolvableToString = (perms: PermissionResolvable) => {
    const permissions = new Permissions(perms);
    const str: string[] = [];

    for (const [perm, has] of Object.entries(permissions.serialize())) {
        if (has) str.push(inlineCode(perm));
    }

    return str.join(', ');
}