import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";

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
                aliases: [ 'member' ]
            }
        );
    }

    init(message: Message) {
        return message.channel.send(Embed.success(`
        There are **${message.guild.memberCount.toLocaleString()}** members in ${message.guild.name}!
        `));
    }
}