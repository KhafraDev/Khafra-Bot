import { Arguments, Command } from '../../../Structures/Command.js';
import { Role } from 'discord.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { bold, inlineCode, time } from '@discordjs/builders';
import { Message } from '../../../lib/types/Discord.js.js';

@RegisterCommand
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

    async init(message: Message, { content }: Arguments) {
        const role = 
            await getMentions(message, 'roles') ?? 
            message.guild.roles.cache.find(r => r.name.toLowerCase() === content.toLowerCase());

        if (!(role instanceof Role)) {
            return this.Embed.fail('No role found!');
        } else if (role.deleted) {
            return this.Embed.fail('Role has been deleted.');
        }

        const embed = this.Embed.success()
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