import { isText, isThread, isVoice } from '#khaf/utility/Discord.js';
import { inlineCode } from '@discordjs/builders';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { GuildMember, type PermissionResolvable, type RecursiveReadonlyArray, Role } from 'discord.js';

const isRecursiveReadonlyArray = <T>(item: unknown):
    item is RecursiveReadonlyArray<T> => Array.isArray(item);

export const resolvePerms = (perms: PermissionResolvable): bigint => {
    let bitfield: bigint | undefined;
    if (typeof perms === 'string') {
        bitfield = BigInt(perms);
    } else if (typeof perms === 'bigint') {
        bitfield = perms;
    } else if ('bitfield' in perms) {
        bitfield = perms.bitfield;
    } else if (isRecursiveReadonlyArray(perms)) {
        for (const item of perms.flat(10) as (`${bigint}` | bigint | keyof typeof PermissionFlagsBits)[]) {
            if (typeof item === 'bigint') {
                bitfield! |= item;
            } else if (typeof item === 'string') {
                if (isNaN(Number(item))) {
                    bitfield! |= PermissionFlagsBits[item as keyof typeof PermissionFlagsBits];
                } else {
                    bitfield! |= BigInt(item);
                }
            }
        }
    }

    return bitfield!;
}

/**
 * Check if a user or role has permissions in a channel.
 */
export const hasPerms = (
    channel: unknown,
    memberOrRole: unknown,
    perms: PermissionResolvable
): boolean => {
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
): boolean => {
    if (!a || !b) return false;
    if (a.guild.ownerId === a.id) return true;

    return strict
        ? a.roles.highest.comparePositionTo(b.roles.highest) > 0
        : a.roles.highest.comparePositionTo(b.roles.highest) >= 0;
}

const all = Object.entries(PermissionFlagsBits) as [
    keyof typeof PermissionFlagsBits, bigint
][];

export const permResolvableToString = (perms: PermissionResolvable): string[] => {
    const bitfield = resolvePerms(perms);
    const has: string[] = [];

    for (const [name, bit] of all) {
        if ((bit & bitfield) === bit) {
            if (name === 'Administrator') {
                return [inlineCode(name)];
            }

            has.push(inlineCode(name));
        }
    }

    return has;
}

export const toString = (perms: bigint[]): string => {
    return perms.reduce(
        (a, b) => a | b, 0n
    ).toString();
}