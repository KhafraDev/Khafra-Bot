import { Arguments, Command } from '#khaf/Command';
import { Message, Role } from 'discord.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { bold, inlineCode, time } from '@khaf/builders';

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get role info',
                '1234567891234567',
                '@role'
            ],
			{
                name: 'role',
                folder: 'Server',
                aliases: [ 'roleinfo' ],
                args: [1, 50],
                guildOnly: true
            }
        );
    }

    async init(message: Message<true>, { content }: Arguments) {
        const role = 
            await getMentions(message, 'roles') ?? 
            message.guild.roles.cache.find(r => r.name.toLowerCase() === content.toLowerCase());

        if (!(role instanceof Role)) {
            return this.Embed.error('No role found!');
        }

        const embed = this.Embed.ok()
            .setDescription(`
            ${role}
            
            Permissions: 
            ${inlineCode(role.permissions.toArray().join(', '))}
            `)
            .addField(bold('Name:'), role.name, true)
            .addField(bold('Color:'), role.hexColor, true)
            .addField(bold('Created:'), time(role.createdAt), true)
            .addField(bold('Mentionable:'), role.mentionable ? 'Yes' : 'No', true)
            .addField(bold('Hoisted:'), role.hoist ? 'Yes' : 'No', true)
            .addField(bold('Position:'), `${role.position}`, true)
            .addField(bold('Managed:'), role.managed ? 'Yes' : 'No');

        if (role.icon) {
            embed.setImage(role.iconURL()!);
        }
        
        return embed;
    }
}