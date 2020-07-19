import Command from "../../Structures/Command";
import { Message, MessageEmbed } from "discord.js";
import { dbHelpers } from "../../Structures/GuildSettings/GuildSettings";
import Embed from "../../Structures/Embed";

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
            return message.channel.send(Embed.missing_perms(this.permissions, true));
        } else if(args.length < 1) {
            return message.channel.send(Embed.missing_args(1, this.name, [
                '>>',
                '!!'
            ]));
        }

        const row = dbHelpers.get(message.guild.id);
        if(!row) {
            return message.channel.send(Embed.fail(`
            GuildSettings has to be implemented by an administrator!

            Let them know to use the \`\`create\`\` command!
            `));
        }

        const newPrefix = args.shift();
        const updated = dbHelpers.updatePrefix({
            newPrefix,
            id: message.guild.id
        });

        if(updated.changes === 1) {
            return message.channel.send(this.formatEmbed(newPrefix));
        } else {
            return message.channel.send(Embed.fail('An unexpected error occurred!'));
        }
    }

    formatEmbed(prefix: string): MessageEmbed {
        const embed = Embed.success(`Changed prefix to \`\`${prefix}\`\`!`);

        return embed;
    }
}