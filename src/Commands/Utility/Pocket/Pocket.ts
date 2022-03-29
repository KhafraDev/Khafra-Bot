import { Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { inlineCode, type UnsafeEmbed } from '@discordjs/builders';

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Pocket: Connect your Pocket account to Khafra-Bot!'
            ],
            {
                name: 'pocket',
                folder: 'Pocket',
                args: [0]
            }
        );
    }

    async init (): Promise<UnsafeEmbed> {
        return Embed.ok()
            .setAuthor({ name: 'GetPocket', url: 'https://app.getpocket.com/' })
            .setDescription(`
            Connect your Pocket account to Khafra-Bot to get updates on the latest news.
            
            Examples:
            ${inlineCode('pocketinit')} - Start the process of authorizing your Pocket account.
            ${inlineCode('pocketget')} - List your favorited articles.
            ${inlineCode('pocketadd [article] [optional title]')}
            `);
    }
}