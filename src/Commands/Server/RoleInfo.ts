import { Command } from "../../Structures/Command";
import { Message, Role } from "discord.js";
import Embed from "../../Structures/Embed";
import { formatDate } from "../../Backend/Helpers/Date";

export default class extends Command {
    constructor() {
        super(
            'role',
            [
                'Get role info',
                '1234567891234567',
                '@role'
            ],
            [ /* No extra perms needed */],
            5,
            [ 'roleinfo' ]
        );
    }

    async init(message: Message, args: string[]) {
        if(args.length < 1) {
            return message.channel.send(Embed.missing_args(1, this.name, this.help.slice(1)));
        }

        let role: Role = message.mentions.roles.first();
        try {
            if(!role) {
                role = await message.guild.roles.fetch(args[0]);
            }
        } catch {
            return message.channel.send(Embed.fail('Invalid role!'));
        }

        if(role.deleted) {
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
            .addField('**Created:**', formatDate('MMMM Do, YYYY kk:mm:ssA', role.createdAt), true)
            .addField('**Mentionable:**', role.mentionable ? 'Yes' : 'No', true)
            .addField('**Hoisted:**', role.hoist ? 'Yes' : 'No', true)
            .addField('**Position:**', role.position, true);

        return message.channel.send(embed);
    }
}