import { Command } from "../../Structures/Command.js";
import { Message } from "discord.js";
import { KhafraClient } from "../../Bot/KhafraBot.js";

export default class extends Command {
    constructor() {
        super(
            [
                'List all the commands Khafra-Bot offers!',
                '', 'settings', 'utility'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'commandlist',
                folder: 'Server',
                aliases: [ 'list' ],
                args: [0, 1]
            }
        );
    }

    init(message: Message, args: string[]) {
        const folders = new Set([...KhafraClient.Commands.values()].map(c => c.settings.folder));
        const category = args[0]?.charAt(0).toUpperCase() + args[0]?.slice(1).toLowerCase();

        if(args.length === 0 || !folders.has(category)) {
            const embed = this.Embed.success()
                .setTitle('Command types:')
                .setDescription(`
                Provide a folder name to lookup all the commands available for said category!
                Valid categories are:

                \`\`${[...folders].join(', ')}\`\`
                `);

            return message.channel.send(embed);
        }

        const commands = [...KhafraClient.Commands.values()].filter(c => c.settings.folder === category);
        const embed = this.Embed.success()
            .setTitle(`${category} Category`)
            .setDescription(`
            ${[...new Set(commands.map(c => '``' + c.settings.name + '``'))].join(', ')}
            
            Use the \`\`help\`\` command to get example usage and description of a command!
            `);
            

        return message.channel.send(embed);
    }
}