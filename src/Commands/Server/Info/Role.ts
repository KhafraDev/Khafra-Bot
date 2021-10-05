import { Arguments, Command } from '../../../Structures/Command.js';
import { Role } from 'discord.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { time } from '@discordjs/builders';
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
            \`\`${role.permissions.toArray().join(', ')}\`\`
            `)
            .addField('**Name:**', role.name, true)
            .addField('**Color:**', role.hexColor, true)
            .addField('**Created:**', time(role.createdAt), true)
            .addField('**Mentionable:**', role.mentionable ? 'Yes' : 'No', true)
            .addField('**Hoisted:**', role.hoist ? 'Yes' : 'No', true)
            .addField('**Position:**', `${role.position}`, true)
            .addField('**Managed:**', role.managed ? 'Yes' : 'No');

        if (role.icon) {
            embed.setImage(role.iconURL()!);
        }
        
        return embed;
    }
}