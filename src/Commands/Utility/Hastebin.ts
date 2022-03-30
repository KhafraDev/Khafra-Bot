import type { Arguments} from '#khaf/Command';
import { Command } from '#khaf/Command';
import { pasteAliases } from '#khaf/utility/commands/Pastes';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { inlineCode, type UnsafeEmbed } from '@discordjs/builders';
import type { Message } from 'discord.js';

const keys = ['pastebin', ...pasteAliases.keys()];

export class kCommand extends Command {
    constructor () {
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

    async init (_message: Message, { content, commandName }: Arguments): Promise<UnsafeEmbed> {
        const command = commandName.toLowerCase();

        if (command === 'pastebin' || content.length == 0)
            return Embed.ok(`
            Here is a list of the sites currently supported by this command:
            ${keys.map(k => inlineCode(k)).join(', ')}
            `);

        const paste = pasteAliases.get(command)!;
        const pasteLink = await paste(content);

        if (!pasteLink)
            return Embed.error('A server error prevented me from uploading the paste. Try a different server!');

        return Embed.ok(pasteLink);
    }
}