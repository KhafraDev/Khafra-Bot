import { Command } from "../../Structures/Command.js";
import { Message } from "discord.js";

export default class extends Command {
    constructor() {
        super(
            [
                'Get the number of members in a guild!',
                ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'members',
                folder: 'Server',
                args: [0, 0],
                guildOnly: true,
                aliases: [ 'membercount' ]
            }
        );
    }

    init(message: Message) {
        return message.reply(this.Embed.success(`
        There are **${message.guild.memberCount.toLocaleString()}** members in ${message.guild.name}!
        `));
    }
}