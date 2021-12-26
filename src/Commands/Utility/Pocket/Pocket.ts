import { inlineCode } from '@khaf/builders';
import { Command } from '#khaf/Command';

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

    async init() {
        return this.Embed.ok()
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