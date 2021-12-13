import { inlineCode } from '@khaf/builders';
import { GuildMember, PermissionResolvable, Permissions, Role } from 'discord.js';
import { isText, isThread, isVoice } from '../types/Discord.js.js';
import { upperCase } from './String.js';

/**
 * Check if a user or role has permissions in a channel.
 */
export const hasPerms = (
    channel: unknown, 
    memberOrRole: unknown, 
    perms: PermissionResolvable
) => {
    if (typeof channel === 'undefined' || channel === null)
        return false;
    if (!isText(channel) && !isVoice(channel) && !isThread(channel))
        return true;
    if (!(memberOrRole instanceof GuildMember) && !(memberOrRole instanceof Role))
        return false;

    return channel.permissionsFor(memberOrRole).has(perms);
}

/**
 * Compares 2 guildmembers and checks if @see {a} is higher in the hierarchy than @see {b}
 * @see https://discord.js.org/#/docs/main/stable/class/Role?scrollTo=comparePositionTo
 * @see https://discord.js.org/#/docs/main/stable/class/GuildMember?scrollTo=manageable
 */
export const hierarchy = (
    a: GuildMember | null,
    b: GuildMember | null,
    strict = true
) => {
    if (!a || !b) return false;
    
    const cond = strict
        ? a.roles.highest.comparePositionTo(b.roles.highest) > 0
        : a.roles.highest.comparePositionTo(b.roles.highest) >= 0;

    return a.guild.ownerId === a.id || cond;
}

export const permResolvableToString = (perms: PermissionResolvable) => {
    const permissions = perms instanceof Permissions ? perms : new Permissions(perms);
    const str: string[] = [];

    if (permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
        str.push(inlineCode(`Administrator`));
    } else {
        for (const [permName, has] of Object.entries(permissions.serialize())) {
            if (has) {
                const nameParts = permName.split('_');
                const full = inlineCode(nameParts.map(part => upperCase(part)).join(' '));
                str.push(full);
            }
        }
    }

    return str;
}