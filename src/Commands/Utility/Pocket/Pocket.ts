import { Command } from '#khaf/Command';
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js';
import { inlineCode } from '@discordjs/builders';
import type { APIEmbed } from 'discord-api-types/v10';

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

    async init (): Promise<APIEmbed> {
        return Embed.json({
            color: colors.ok,
            description: `
            Connect your Pocket account to Khafra-Bot to get updates on the latest news.
            
            Examples:
            ${inlineCode('pocketinit')} - Start the process of authorizing your Pocket account.
            ${inlineCode('pocketget')} - List your favorited articles.
            ${inlineCode('pocketadd [article] [optional title]')}`,
            author: { name: 'GetPocket', url: 'https://app.getpocket.com/' }
        });
    }
}