import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';


export default class extends Command {
    constructor() {
        super(
            [
                'Pocket: Connect your Pocket account to Khafra-Bot!',
                ''
            ],
			{
                name: 'pocket',
                folder: 'Pocket',
                args: [0, 0]
            }
        );
    }

    async init(message: Message) {
        const embed = this.Embed.success()
            .setAuthor('GetPocket', null, 'https://app.getpocket.com/')
            .setDescription(`
            Connect your Pocket account to Khafra-Bot to get updates on the latest news.
            
            Examples:
            \`\`pocketinit\`\` - Start the process of authorizing your Pocket account.
            `);

        return message.reply(embed);
    }
}