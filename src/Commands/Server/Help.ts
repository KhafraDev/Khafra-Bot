import { Command } from "../../Structures/Command.js";
import { Message } from "discord.js";
import { KhafraClient } from "../../Bot/KhafraBot.js";
import { compareTwoStrings } from "../../lib/Utility/CompareStrings.js";

export default class extends Command {
    constructor() {
        super(
            [
                'Display examples and description of a command!',
                'say', '', 'Fun'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'help',
                folder: 'Server',
                aliases: [ 'commandlist', 'list' ],
                args: [0, 1]
            }
        );
    }

    init(message: Message, args: string[]) {
        const folders = [...new Set([...KhafraClient.Commands.values()].map(c => c.settings.folder))];
        const name = args.join(' ').toLowerCase();
        const isFolder = folders.some(f => f.toLowerCase() === name);

        if(!KhafraClient.Commands.has(name) && !isFolder) {
            const all = args.length === 0 ? [] : [...new Set(KhafraClient.Commands.values())]
                .map(c => [c.settings.name, compareTwoStrings(name, c.settings.name)])
                .sort((a, b) => +b[1] - +a[1])
                .slice(0, 5);
            
            if(all.every(c => c[1] === 0)) {
                return message.reply(this.Embed.success(`
                [Khafra-Bot](https://github.com/khafradev/khafra-bot)

                Khafra-Bot has a system of sorting commands by \`\`folder\`\`, or a tag that identifies what their function is.
                To list all the commands in a certain folder, you can use the \`\`help [folder]\`\` command (where \`\`[folder]\`\` refers to the folder's name).

                All of the command folders:
                ${folders.map(f => `\`\`${f}\`\``).join(', ')}
                `));
            } else {
                return message.reply(this.Embed.success(`
                No command with that name was found, however some commands may have a similar name. 
                Did you mean: 
                ${all.map(n => `\`\`${n[0]}\`\` (${(+n[1] * 100).toFixed(2)}% similarity)`).join('\n')}?
                `));
            }
        } else if(isFolder) {
            const cmdsOfFolder = [...KhafraClient.Commands.entries()].filter(([n, v]) => {
                return !v.settings.aliases?.includes(n) && v.settings.folder.toLowerCase() === name;
            }).map(l => l[0]);

            return message.reply(this.Embed.success(`
            ${name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()} Commands (${cmdsOfFolder.length})
            ${cmdsOfFolder.map(n => `\`\`${n}\`\``).join(', ')}

            Want to view a single command's info? Use this command again, but provide the name of a command.
            For example, \`\`help ${cmdsOfFolder[Math.floor(Math.random() * cmdsOfFolder.length)]}\`\`.
            `));
        }

        const { settings, permissions, help } = KhafraClient.Commands.get(name);
        const embed = this.Embed.success(`
        The \`\`${settings.name}\`\` command:
        \`\`\`${help[0]}\`\`\`

        Aliases: ${settings.aliases?.map(a => `\`\`${a}\`\``).join(', ')}
        Permissions: ${permissions.map(p => `\`\`${p}\`\``).join(', ')}

        Example(s):
        ${help.slice(1).map(c => `\`\`${settings.name} ${c || '​'}\`\``.trim()).join('\n')}
        `)
        .addFields(
            { name: '**Guild Only:**', value: settings.guildOnly ? 'Yes' : 'No', inline: true },
            { name: '**Owner Only:**', value: settings.ownerOnly ? 'Yes' : 'No', inline: true }
        );

        return message.reply(embed);
    }
}