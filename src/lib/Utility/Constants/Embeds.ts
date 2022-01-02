import { bold, inlineCode } from '@khaf/builders';
import {
    GuildMember,
    NewsChannel,
    PermissionResolvable,
    Role,
    TextChannel,
    ThreadChannel,
    VoiceChannel
} from 'discord.js';
import { join } from 'path';
import { Command } from '#khaf/Command';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { permResolvableToString } from '#khaf/utility/Permissions.js';
import { plural } from '#khaf/utility/String.js';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { MessageEmbed } from '#khaf/Embed';

const config = createFileWatcher({} as typeof import('../../../../config.json'), join(cwd, 'config.json'));

type PartialCommand = {
    settings: Command['settings'],
    help: Command['help']
}

type PermissionChannels = TextChannel | NewsChannel | VoiceChannel | ThreadChannel;

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
        inChannel: PermissionChannels,
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
    },

    // TODO(@KhafraDev): remove or replace this with a better alternative.
    /**
     * A generic help embed useful for most situations.
     */
    generic: ({ settings, help }: PartialCommand, reason?: string) => {
        const [min, max = 'no'] = settings.args;
        const r = reason ?? `Missing ${min} minimum argument${plural(min)} (${max} maximum).`;
        
        return new MessageEmbed()
            .setColor(colors.error)
            .setDescription(`
            ${r}

            Aliases: ${settings.aliases!.map(a => inlineCode(a)).join(', ')}

            Example Usage:
            ${help.slice(1).map((e: string) => inlineCode(`${settings.name}${e.length > 0 ? ` ${e}` : ''}`)).join('\n')}
            `)
            .addFields(
                { name: bold('Guild Only:'), value: settings.guildOnly ? 'Yes' : 'No', inline: true },
                { name: bold('Owner Only:'), value: settings.ownerOnly ? 'Yes' : 'No', inline: true }
            );
    }
}

export const padEmbedFields = (embed: MessageEmbed) => {
    while (embed.fields.length % 3 !== 0 && embed.fields.length !== 0) {
        embed.addField('\u200b', '\u200b', true);
    }

    return embed;
}