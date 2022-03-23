import { cwd } from '#khaf/utility/Constants/Path.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { permResolvableToString } from '#khaf/utility/Permissions.js';
import { UnsafeEmbed } from '@discordjs/builders';
import {
    AnyChannel,
    GuildMember,
    PermissionResolvable,
    Role
} from 'discord.js';
import { join } from 'path';

const config = createFileWatcher(
    {} as typeof import('../../../../config.json'),
    join(cwd, 'config.json')
);

export const colors = {
    ok: Number.parseInt(config.colors.default.slice(1), 16),
    error: Number.parseInt(config.colors.error.slice(1), 16),
    boost: Number.parseInt(config.colors.boost.slice(1), 16)
} as const;

export const Embed = {
    error: (reason?: string): UnsafeEmbed => {
        const Embed = new UnsafeEmbed().setColor(colors.error);

        if (reason) {
            Embed.setDescription(reason);
        }

        return Embed;
    },

    /**
     * An embed for a command being successfully executed!
     */
    ok: (reason?: string): UnsafeEmbed => {
        const Embed = new UnsafeEmbed().setColor(colors.ok);

        if (reason) {
            Embed.setDescription(reason);
        }

        return Embed;
    },

    perms: (
        inChannel: AnyChannel,
        userOrRole: GuildMember | Role | null,
        permissions: PermissionResolvable
    ): UnsafeEmbed => {
        const perms = permResolvableToString(permissions);
        const checkType = userOrRole && 'color' in userOrRole
            ? `The role ${userOrRole}`
            : userOrRole
                ? `User ${userOrRole}`
                : 'The user';
        const amountMissing = perms.length === 1 ? 'this permission' : 'these permissions';

        const reason =
            `${checkType} is missing ${amountMissing}: ${perms.join(', ')} in ${inChannel}`;

        return Embed.error(reason);
    }
}

export const padEmbedFields = (embed: UnsafeEmbed): UnsafeEmbed => {
    while (embed.fields!.length % 3 !== 0 && embed.fields!.length !== 0) {
        embed.addFields({ name: '\u200b', value: '\u200b', inline: true });
    }

    return embed;
}