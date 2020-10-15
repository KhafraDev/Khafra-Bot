import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import { KhafraClient } from "../../Bot/KhafraBot";

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
        The \`\`${command.settings.name}\`\` command:

        Aliases: ${command.settings.aliases?.map(a => `\`\`${a}\`\``).join(', ')}
        Permissions: ${command.permissions.map(p => `\`\`${p}\`\``).join(', ')}

        Example Usage:
        ${command.help.slice(1).map((e: string) => `\`\`${command.settings.name}${e.length > 0 ? ` ${e}` : ''}\`\``).join('\n')}
        `)
        .addFields(
            { name: '**Guild Only:**', value: command.settings.guildOnly ? 'Yes' : 'No', inline: true },
            { name: '**Owner Only:**', value: command.settings.ownerOnly ? 'Yes' : 'No', inline: true }
        );

        return message.channel.send(embed);
    }
}