import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { pasteAliases } from '../../lib/Backend/Pastes.js';
import { isDM, isText } from '../../lib/types/Discord.js.js';

const keys = ['pastebin', ...pasteAliases.keys()];
// matches prefix, command, and content
const r = new RegExp(`^(.*?)(${keys.join('|')}) (.*?)$`, 'i');
// matches prefix and command (no command)
const s = new RegExp(`^(.*?)(${keys.join('|')})`, 'i');

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

    async init(message: Message, args: string[]) {
        // "!pastebin" is a valid use, but would return null with the first regex because it looks for a space after the command
        const [, /*prefix*/, command, content] = message.content.match(r) ?? message.content.match(s);

        if (command === 'pastebin' || args.length == 0) 
            return this.Embed.success(`
            Here is a list of the sites currently supported by this command:
            ${keys.map(k => `\`\`${k}\`\``).join(', ')}
            `);

        if (message.reference && message.reference.messageID) { // messageID is an optional param, cannot fetch message without it though
            const channel = message.guild.channels.cache.get(message.reference.channelID);
            if (isText(channel) || isDM(channel)) {
                const { content, url } = await channel.messages.fetch(message.reference.messageID);
                
                if (content.length === 0)
                    return this.Embed.fail(`[Message](${url}) has no text content, sorry.`);

                const paste = pasteAliases.get(command.toLowerCase());
                const pasteLink = await paste(content);

                if (!pasteLink)
                    return this.Embed.fail('A server error prevented me from uploading the paste. Try a different server!');

                return this.Embed.success(pasteLink);
            } 
        }

        const paste = pasteAliases.get(command.toLowerCase());
        const pasteLink = await paste(content);

        if (!pasteLink)
            return this.Embed.fail('A server error prevented me from uploading the paste. Try a different server!');

        return this.Embed.success(pasteLink);
    }
}