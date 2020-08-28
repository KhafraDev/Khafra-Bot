import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";

export default class extends Command {
    constructor() {
        super(
            [
                'Get the bot\'s ping!',
                ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'ping',
                folder: 'Fun',
                cooldown: 10
            }
        );
    }

    async init(message: Message) {
        const m = await message.channel.send(Embed.success('Pinging...!'));
        const embed = Embed.success(`
        Pong! 🏓

        Bot: ${m.createdTimestamp - message.createdTimestamp} ms
        Heartbeat: ${m.client.ws.ping} ms
        `);

        return m.edit(embed);
    }
}