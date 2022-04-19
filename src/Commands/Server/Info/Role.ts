import type { Arguments} from '#khaf/Command';
import { Command } from '#khaf/Command';
import { Embed, EmbedUtil } from '#khaf/utility/Constants/Embeds.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { bold, inlineCode, time } from '@discordjs/builders';
import type { APIEmbed } from 'discord-api-types/v10';
import type { Message} from 'discord.js';
import { Role } from 'discord.js';

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

    async init (message: Message<true>, { content }: Arguments): Promise<APIEmbed> {
        const role =
            await getMentions(message, 'roles') ??
            message.guild.roles.cache.find(r => r.name.toLowerCase() === content.toLowerCase());

        if (!(role instanceof Role)) {
            return Embed.error('No role found!');
        }

        const embed = Embed.ok();
        EmbedUtil.setDescription(
            embed,
            `${role}
            
            Permissions: 
            ${inlineCode(role.permissions.toArray().join(', '))}`
        );
        EmbedUtil.addFields(
            embed,
            { name: bold('Name:'), value: role.name, inline: true },
            { name: bold('Color:'), value: role.hexColor, inline: true },
            { name: bold('Created:'), value: time(role.createdAt), inline: true },
            { name: bold('Mentionable:'), value: role.mentionable ? 'Yes' : 'No', inline: true },
            { name: bold('Hoisted:'), value: role.hoist ? 'Yes' : 'No', inline: true },
            { name: bold('Position:'), value: `${role.position}`, inline: true },
            { name: bold('Managed:'), value: role.managed ? 'Yes' : 'No' }
        );

        if (role.icon) {
            EmbedUtil.setImage(embed, { url: role.iconURL()! });
        }

        return embed;
    }
}