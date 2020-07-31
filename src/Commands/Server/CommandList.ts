import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";
import KhafraClient from "../../Bot/KhafraBot";

export default class extends Command {
    constructor() {
        super(
            'commandlist',
            [
                'List all the commands Khafra-Bot offers!',
                ''
            ],
            [ /* No extra perms needed */ ],
            5,
            [ 'list' ]
        );
    }

    init(message: Message) {
        const embed = Embed.success()
            .setDescription(`
            ${[...KhafraClient.Commands.keys()].join(', ')}
            `);

        return message.channel.send(embed);
    }
}