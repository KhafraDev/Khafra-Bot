import { MessageEmbed, PermissionResolvable, Permissions } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import config from '../../../../config.json';
import { permResolvableToString } from '../Permissions.js';

type PartialCommand = {
    settings: Command['settings'],
    help: Command['help']
}

const defaultPerms = [ 
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.EMBED_LINKS,
    Permissions.FLAGS.VIEW_CHANNEL, 
    Permissions.FLAGS.READ_MESSAGE_HISTORY 
]

export const Embed = {
    fail: (reason?: string) => {
        const Embed = new MessageEmbed().setColor(config.embed.fail);
        reason && Embed.setDescription(reason);
        
        return Embed;
    },

    /**
     * An embed for a command being successfully executed!
     */
    success: (reason?: string) => {
        const Embed = new MessageEmbed().setColor(config.embed.success); 
        reason && Embed.setDescription(reason);
        
        return Embed;
    },

    /**
     * An embed for missing permissions!
     */
    missing_perms: (admin?: boolean, perms: PermissionResolvable = defaultPerms) => {
        return new MessageEmbed()
            .setColor(config.embed.fail)
            .setDescription(`
            One of us doesn't have the needed permissions!

            Both of us must have ${permResolvableToString(perms)} permissions to use this command!
            ${admin ? 'You must have \`\`ADMINISTRATOR\`\` perms to use this command!' : '' }
            `);
    },

    /**
     * A generic help embed useful for most situations.
     */
    generic: ({ settings, help }: PartialCommand, reason?: string) => {
        const [min, max] = settings.args;
        const r = reason ?? `Missing ${min} minimum argument${min === 1 ? '' : 's'} (${max} maximum).`;
        
        return new MessageEmbed()
            .setColor(config.embed.fail)
            .setDescription(`
            ${r}

            Aliases: ${settings.aliases.map(a => `\`\`${a}\`\``).join(', ')}

            Example Usage:
            ${help.slice(1).map((e: string) => `\`\`${settings.name}${e.length > 0 ? ` ${e}` : ''}\`\``).join('\n')}
            `)
            .addFields(
                { name: '**Guild Only:**', value: settings.guildOnly ? 'Yes' : 'No', inline: true },
                { name: '**Owner Only:**', value: settings.ownerOnly ? 'Yes' : 'No', inline: true }
            );
    }
}