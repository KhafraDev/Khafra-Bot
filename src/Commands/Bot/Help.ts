import { Command, Arguments } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { KhafraClient } from '../../Bot/KhafraBot.js';
import { compareTwoStrings } from '../../lib/Utility/CompareStrings.js';
import { upperCase } from '../../lib/Utility/String.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Display examples and description of a command!',
                'say', '', 'Fun'
            ],
			{
                name: 'help',
                folder: 'Bot',
                aliases: [ 'commandlist', 'list' ],
                args: [0, 1],
                ratelimit: 3
            }
        );
    }

    async init(_message: Message, { args }: Arguments) {
        const folders = [...new Set([...KhafraClient.Commands.values()].map(c => c.settings.folder))];
        const name = args.join(' ').toLowerCase();
        const isFolder = folders.some(f => f.toLowerCase() === name);

        if (!KhafraClient.Commands.has(name) && !isFolder) {
            const all = args.length === 0 ? [] : [...new Set(KhafraClient.Commands.values())]
                .map(c => [c.settings.name, compareTwoStrings(name, c.settings.name)])
                .sort((a, b) => +b[1] - +a[1])
                .slice(0, 5);
            
            if (all.every(c => c[1] === 0)) {
                return this.Embed.success(`
                [Khafra-Bot](https://github.com/khafradev/khafra-bot)

                Khafra-Bot has a system of sorting commands by \`\`folder\`\`, or a tag that identifies what their function is.
                To list all the commands in a certain folder, you can use the \`\`help [folder]\`\` command (where \`\`[folder]\`\` refers to the folder's name).

                You can also get help on a single command using \`\`help [command]\`\`!

                All of the command folders:
                ${folders.map(f => `\`\`${f}\`\``).join(', ')}
                `);
            } else {
                return this.Embed.success(`
                No command with that name was found, however some commands may have a similar name. 
                Commands with similar names: 
                ${all.map(n => `\`\`${n[0]}\`\` (${(+n[1] * 100).toFixed(2)}% similarity)`).join('\n')}
                `);
            }
        } else if (isFolder) {
            const cmdsOfFolder = [...KhafraClient.Commands.entries()].filter(([n, v]) => {
                return !v.settings.aliases.includes(n) && v.settings.folder.toLowerCase() === name;
            }).map(l => l[0]);

            return this.Embed.success(`
            ${upperCase(name)} Commands (${cmdsOfFolder.length})
            ${cmdsOfFolder.map(n => `\`\`${n}\`\``).join(', ')}

            Want to view a single command's info? Use this command again, but provide the name of a command.
            For example, \`\`help ${cmdsOfFolder[Math.floor(Math.random() * cmdsOfFolder.length)]}\`\`.
            `);
        }

        const { settings, help } = KhafraClient.Commands.get(name);
        return this.Embed.success(`
        The \`\`${settings.name}\`\` command:
        \`\`\`${help[0]}\`\`\`

        Aliases: ${settings.aliases.map(a => `\`\`${a}\`\``).join(', ')}

        Example(s):
        ${help.slice(1).map(c => `\`\`${settings.name} ${c || '​'}\`\``.trim()).join('\n')}
        `)
        .addFields(
            { name: '**Guild Only:**', value: settings.guildOnly ? 'Yes' : 'No', inline: true },
            { name: '**Owner Only:**', value: settings.ownerOnly ? 'Yes' : 'No', inline: true },
            { name: '**Rate-Limit:**', value: `${settings.ratelimit} seconds`, inline: true}
        );
    }
}