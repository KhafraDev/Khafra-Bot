import { Arguments, Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { bold, inlineCode, time, type UnsafeEmbed } from '@discordjs/builders';
import { Message, Role } from 'discord.js';

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Get role info',
                '1234567891234567',
                '@role'
            ],
            {
                name: 'role',
                folder: 'Server',
                aliases: ['roleinfo'],
                args: [1, 50],
                guildOnly: true
            }
        );
    }

    async init (message: Message<true>, { content }: Arguments): Promise<UnsafeEmbed> {
        const role =
            await getMentions(message, 'roles') ??
            message.guild.roles.cache.find(r => r.name.toLowerCase() === content.toLowerCase());

        if (!(role instanceof Role)) {
            return Embed.error('No role found!');
        }

        const embed = Embed.ok()
            .setDescription(`
            ${role}
            
            Permissions: 
            ${inlineCode(role.permissions.toArray().join(', '))}
            `)
            .addFields(
                { name: bold('Name:'), value: role.name, inline: true },
                { name: bold('Color:'), value: role.hexColor, inline: true },
                { name: bold('Created:'), value: time(role.createdAt), inline: true },
                { name: bold('Mentionable:'), value: role.mentionable ? 'Yes' : 'No', inline: true },
                { name: bold('Hoisted:'), value: role.hoist ? 'Yes' : 'No', inline: true },
                { name: bold('Position:'), value: `${role.position}`, inline: true },
                { name: bold('Managed:'), value: role.managed ? 'Yes' : 'No' }
            );

        if (role.icon) {
            embed.setImage(role.iconURL());
        }

        return embed;
    }
}