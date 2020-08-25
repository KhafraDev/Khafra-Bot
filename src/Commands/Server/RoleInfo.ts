import { Command } from "../../Structures/Command";
import { Message, Role, MessageMentions } from "discord.js";
import Embed from "../../Structures/Embed";
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
                cooldown: 5,
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(args.length < 1) {
            return message.channel.send(Embed.missing_args.call(this, 1));
        } else if(!/[A-z0-9]/.test(args[0])) {
            return message.channel.send(Embed.missing_args.call(this, 1));
        }

        const role = MessageMentions.ROLES_PATTERN.test(args[0]) 
            ? message.mentions.roles.first() 
            : await message.guild.roles.fetch(args[0]);

        if(!(role instanceof Role)) {
            return message.channel.send(Embed.fail('No role found!'));
        } else if(role.deleted) {
            return message.channel.send(Embed.fail('Role has been deleted.'));
        }

        const embed = Embed.success()
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
            .addField('**Position:**', role.position, true);

        return message.channel.send(embed);
    }
}