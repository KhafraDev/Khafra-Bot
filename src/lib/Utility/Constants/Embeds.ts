import { MessageEmbed } from '#khaf/Embed';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { permResolvableToString } from '#khaf/utility/Permissions.js';
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

const colors = {
    ok: Number.parseInt(config.embed.success.slice(1), 16),
    error: Number.parseInt(config.embed.fail.slice(1), 16)
};

export const Embed = {
    error: (reason?: string) => {
        const Embed = new MessageEmbed().setColor(colors.error);

        if (reason) {
            Embed.setDescription(reason);
        }
        
        return Embed;
    },

    /**
     * An embed for a command being successfully executed!
     */
    ok: (reason?: string) => {
        const Embed = new MessageEmbed().setColor(colors.ok); 
        
        if (reason) {
            Embed.setDescription(reason);
        }
        
        return Embed;
    },

    perms: (
        inChannel: AnyChannel,
        userOrRole: GuildMember | Role | null,
        permissions: PermissionResolvable
    ) => {
        const perms = permResolvableToString(permissions);
        const checkType = userOrRole && 'color' in userOrRole
            ? `The role ${userOrRole}` 
            : userOrRole
                ? `User ${userOrRole}`
                : 'The user';
        const amountMissing = perms.length === 1 ? `this permission` : `these permissions`;

        const reason = 
            `${checkType} is missing ${amountMissing}: ${perms.join(', ')} in ${inChannel}`;

        return Embed.error(reason);
    }
}

export const padEmbedFields = (embed: MessageEmbed) => {
    while (embed.fields.length % 3 !== 0 && embed.fields.length !== 0) {
        embed.addField('\u200b', '\u200b', true);
    }

    return embed;
}