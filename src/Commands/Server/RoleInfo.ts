import { Command } from "../../Structures/Command";
import { Message, Role, MessageMentions } from "discord.js";

import { formatDate } from "../../lib/Utility/Date";

export default class extends Command {
    constructor() {
        super(
            [
                'Get role info',
                '1234567891234567',
                '@role'
            ],
            [ /* No extra perms needed */],
            {
                name: 'role',
                folder: 'Server',
                aliases: [ 'roleinfo' ],
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!/[A-z0-9]/.test(args[0])) {
            return message.channel.send(this.Embed.generic());
        }

        const role = MessageMentions.ROLES_PATTERN.test(args[0]) 
            ? message.mentions.roles.first() 
            : await message.guild.roles.fetch(args[0]);

        if(!(role instanceof Role)) {
            return message.channel.send(this.Embed.fail('No role found!'));
        } else if(role.deleted) {
            return message.channel.send(this.Embed.fail('Role has been deleted.'));
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

        return message.channel.send(embed);
    }
}