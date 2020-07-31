import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";
import KhafraClient from "../../Bot/KhafraBot";

export default class extends Command {
    constructor() {
        super(
            'help',
            [
                'Display examples and description of a command!',
                'say', ''
            ],
            [ /* No extra perms needed */ ],
            5
        );
    }

    init(message: Message, args: string[]) {
        const command = KhafraClient.Commands.get(args[0] ?? 'help');
        if(!command) {
            return message.channel.send(Embed.fail('No command found!'));
        }

        const embed = Embed.success(`
        ${command.help[0]}

        Examples:
        ${command.help.slice(1).map(ex => `\`\`${command.name}${ex.length > 0 ? ' ' + ex : ''}\`\``).join('\n')}
        `);

        return message.channel.send(embed);
    }
}