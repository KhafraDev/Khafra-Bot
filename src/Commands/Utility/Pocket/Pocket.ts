import { Command } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

@RegisterCommand
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
        return this.Embed.success()
            .setAuthor('GetPocket', null, 'https://app.getpocket.com/')
            .setDescription(`
            Connect your Pocket account to Khafra-Bot to get updates on the latest news.
            
            Examples:
            \`\`pocketinit\`\` - Start the process of authorizing your Pocket account.
            \`\`pocketget\`\` - List your favorited articles.
            \`\`pocketadd [article] [optional title]\`\`
            `);
    }
}