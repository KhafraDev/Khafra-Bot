import { Command, Arguments } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { pasteAliases } from '../../lib/Packages/Pastes.js';

const keys = ['pastebin', ...pasteAliases.keys()];

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Upload a paste to a number of different pastebin services!',
                ...keys.slice(1).map(k => `${k} const bot = KhafraClient;`)
            ],
			{
                name: 'pastebin',
                folder: 'Utility',
                args: [0],
                aliases: [...pasteAliases.keys()]
            }
        );
    }

    async init(_message: Message, { content, commandName }: Arguments) {
        const command = commandName.toLowerCase();

        if (command === 'pastebin' || content.length == 0) 
            return this.Embed.success(`
            Here is a list of the sites currently supported by this command:
            ${keys.map(k => `\`\`${k}\`\``).join(', ')}
            `);

        const paste = pasteAliases.get(command);
        const pasteLink = await paste(content);

        if (!pasteLink)
            return this.Embed.fail('A server error prevented me from uploading the paste. Try a different server!');

        return this.Embed.success(pasteLink);
    }
}