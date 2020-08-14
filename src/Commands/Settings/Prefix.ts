import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import { dbHelpers } from "../../lib/Utility/GuildSettings";
import Embed from "../../Structures/Embed";

export default class extends Command {
    constructor() {
        super(
            { name: 'prefix', folder: 'Settings' },
            [ 
                'GuildSettings: Change the prefix for the current guild.',
                '>>', '!!', '?'
            ],
            [ /* No extra perms needed */ ],
            30
        );
    }

    init(message: Message, args: string[]) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(Embed.missing_perms.call(this, true));
        } else if(args.length < 1) {
            return message.channel.send(Embed.missing_args.call(this, 1));
        }

        const row = dbHelpers.get(message.guild.id, 'prefix');
        if(!row) {
            return message.channel.send(Embed.fail(`
            GuildSettings has to be implemented by an administrator!

            Let them know to use the \`\`create\`\` command!
            `));
        }

        const newPrefix = args.shift();
        const updated = dbHelpers.updatePrefix(newPrefix, message.guild.id);

        if(updated.changes === 1) {
            return message.channel.send(Embed.success(`Changed prefix to \`\`${newPrefix}\`\`!`));
        } else {
            return message.channel.send(Embed.fail('An unexpected error occurred!'));
        }
    }
}