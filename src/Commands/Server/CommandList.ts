import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";
import KhafraClient from "../../Bot/KhafraBot";

export default class extends Command {
    constructor() {
        super(
            { name: 'commandlist', folder: 'Server' },
            [
                'List all the commands Khafra-Bot offers!',
                ''
            ],
            [ /* No extra perms needed */ ],
            5,
            [ 'list' ]
        );
    }

    init(message: Message, args: string[]) {
        const folders = new Set([...KhafraClient.Commands.values()].map(c => c.name.folder));
        const category = args[0]?.charAt(0).toUpperCase() + args[0]?.slice(1).toLowerCase();

        if(args.length === 0 || !folders.has(category)) {
            const embed = Embed.success()
                .setTitle('Command types:')
                .setDescription(`
                Provide a folder name to lookup all the commands available for said category!
                Valid categories are:

                \`\`${[...folders].join(', ')}\`\`
                `);

            return message.channel.send(embed);
        }

        const commands = [...KhafraClient.Commands.values()].filter(c => c.name.folder === category);
        const embed = Embed.success()
            .setTitle(`${category} Category`)
            .setDescription(`
            ${[...new Set(commands.map(c => '``' + c.name.name + '``'))].join(', ')}
            
            Use the \`\`help\`\` command to get example usage and description of a command!
            `);
            

        return message.channel.send(embed);
    }
}