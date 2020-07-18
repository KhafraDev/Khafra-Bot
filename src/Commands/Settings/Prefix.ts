import Command from "../../Structures/Command";
import { Message, MessageEmbed } from "discord.js";
import { dbHelpers } from "../../Structures/GuildSettings/GuildSettings";

export default class extends Command {
    constructor() {
        super(
            'prefix',
            'Change the prefix for the current guild.',
            [ 'SEND_MESSAGES', "EMBED_LINKS" ]
        );
    }

    init(message: Message, args: string[]) {
        if((!super.hasPermissions(message) || !super.userHasPerms(message, [ 'ADMINISTRATOR' ]))
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(this.failEmbed(`
            One of us doesn't have the needed permissions!

            Both of us must have \`\`${this.permissions.join(', ')}\`\` permissions to use this command!
            You must have \`\`ADMINISTRATOR\`\` perms to use this command!
            `));
        } else if(args.length < 1) {
            return message.channel.send(this.failEmbed(`
            1 argument is required!

            Examples:
            \`\`${this.name} !!\`\`
            \`\`${this.name} >>\`\`
            `))
        }

        const row = dbHelpers.get(message.guild.id);
        if(!row) {
            return message.channel.send(this.failEmbed(`
            GuildSettings has to be implemented by an administrator!

            Let them know to use the \`\`create\`\` command!
            `));
        }

        const newPrefix = args.shift();
        const updated = dbHelpers.update({
            where:  [ 'id',     message.guild.id ],
            kvPair: [ 'prefix', newPrefix        ]
        });

        if(updated.changes === 1) {
            return message.channel.send(this.formatEmbed(newPrefix));
        } else {
            return message.channel.send(this.failEmbed('An unexpected error occurred!'));
        }
    }

    formatEmbed(prefix: string): MessageEmbed {
        const embed = new MessageEmbed()
            .setDescription(`Changed prefix to \`\`${prefix}\`\`!`);

        return embed;
    }
}