import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { pasteAliases } from '../../lib/Backend/Pastes.js';
import { GuildSettings } from '../../lib/types/Collections.js';

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

    async init(message: Message, args: string[], settings: GuildSettings) {
        // matches beginning of a line with the set prefix, 
        // captures the command name (group 1) up until a space
        // and then matches everything up to the end (including new lines, because of the "s" flag).
        const parseReg = new RegExp(`^${settings.prefix}(${keys.join('|')}) (.*?)$`, 'si')
        const content = message.content.match(parseReg);
        
        if (!content)
            return this.Embed.generic(this, 'Invalid use, could not parse arguments. 😕');

        const [, commandName, text] = content;
        const command = commandName.toLowerCase();

        if (command === 'pastebin' || args.length == 0) 
            return this.Embed.success(`
            Here is a list of the sites currently supported by this command:
            ${keys.map(k => `\`\`${k}\`\``).join(', ')}
            `);

        const paste = pasteAliases.get(command);
        const pasteLink = await paste(text);

        if (!pasteLink)
            return this.Embed.fail('A server error prevented me from uploading the paste. Try a different server!');

        return this.Embed.success(pasteLink);
    }
}