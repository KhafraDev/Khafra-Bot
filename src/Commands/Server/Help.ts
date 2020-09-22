import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import KhafraClient from "../../Bot/KhafraBot";

export default class extends Command {
    constructor() {
        super(
            [
                'Display examples and description of a command!',
                'say', ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'help',
                folder: 'Server',
                args: [0, 1]
            }
        );
    }

    init(message: Message, args: string[]) {
        const command = KhafraClient.Commands.get(args[0]);        
        if(!command) {
            return message.channel.send(this.Embed.fail(`
            No command found!

            For a list of commands try the \`\`list\`\` command!
            `));
        }

        const embed = this.Embed.success(`
        ${command.help[0]}

        Examples:
        ${command.help.slice(1).map(ex => `\`\`${command.settings.name}${ex.length > 0 ? ' ' + ex : ''}\`\``).join('\n')}

        Aliases:
        \`\`${command.settings.aliases?.length > 0 ? command.settings.aliases.join(', ') : 'None'}\`\`
        `);

        return message.channel.send(embed);
    }
}