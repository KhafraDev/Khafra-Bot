import { Command } from '../../../Structures/Command.js';
import { Message, Role } from 'discord.js';
import { formatDate } from '../../../lib/Utility/Date.js';
import { _getMentions } from '../../../lib/Utility/Mentions.js';

export default class extends Command {
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
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message) {
        const role = await _getMentions(message, 'roles');

        if(!(role instanceof Role)) {
            return message.reply(this.Embed.fail('No role found!'));
        } else if(role.deleted) {
            return message.reply(this.Embed.fail('Role has been deleted.'));
        }

        const embed = this.Embed.success()
            .setDescription(`
            ${role}
            
            Permissions: 
            \`\`${role.permissions.toArray().join(', ')}\`\`
            `)
            .addField('**Name:**', role.name, true)
            .addField('**Color:**', role.hexColor, true)
            .addField('**Created:**', formatDate('MMMM Do, YYYY hh:mm:ss A t', role.createdAt), true)
            .addField('**Mentionable:**', role.mentionable ? 'Yes' : 'No', true)
            .addField('**Hoisted:**', role.hoist ? 'Yes' : 'No', true)
            .addField('**Position:**', role.position, true)
            .addField('**Managed:**', role.managed ? 'Yes' : 'No');

        return message.reply(embed);
    }
}