import { MessageEmbed, PermissionResolvable, Permissions } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { permResolvableToString } from '../Permissions.js';
import { plural } from '../String.js';
import { createFileWatcher } from '../FileWatcher.js';
import { cwd } from './Path.js';
import { join } from 'path';
import { bold, inlineCode } from '@khaf/builders';

const config = createFileWatcher({} as typeof import('../../../../config.json'), join(cwd, 'config.json'));

type PartialCommand = {
    settings: Command['settings'],
    help: Command['help']
}

const defaultPerms = [ 
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.EMBED_LINKS,
    Permissions.FLAGS.VIEW_CHANNEL
];

// TODO just use objects
// const embed: APIEmbed = { ... }
// and re-do these weird embeds that suck and aren't used in modern commands anymore.
export const Embed = {
    fail: (reason?: string) => {
        const Embed = new MessageEmbed().setColor(config.embed.fail as `#${string}`);
        reason && Embed.setDescription(reason);
        
        return Embed;
    },

    /**
     * An embed for a command being successfully executed!
     */
    success: (reason?: string) => {
        const Embed = new MessageEmbed().setColor(config.embed.success as `#${string}`); 
        reason && Embed.setDescription(reason);
        
        return Embed;
    },

    /**
     * An embed for missing permissions!
     */
    missing_perms: (admin?: boolean, perms: PermissionResolvable = defaultPerms) => {
        return new MessageEmbed()
            .setColor(config.embed.fail as `#${string}`)
            .setDescription(`
            One of us doesn't have the needed permissions!

            Both of us must have ${permResolvableToString(perms)} permissions to use this command!
            ${admin ? 'You must have ``ADMINISTRATOR`` perms to use this command!' : '' }
            `);
    },

    /**
     * A generic help embed useful for most situations.
     */
    generic: ({ settings, help }: PartialCommand, reason?: string) => {
        const [min, max = 'no'] = settings.args;
        const r = reason ?? `Missing ${min} minimum argument${plural(min)} (${max} maximum).`;
        
        return new MessageEmbed()
            .setColor(config.embed.fail as `#${string}`)
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