import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";

export default class extends Command {
    constructor() {
        super(
            { name: 'pocket', folder: 'Pocket' },
            [
                'Pocket: Connect your Pocket account to Khafra-Bot!',
                ''
            ],
            [ /* No extra perms needed */ ],
            5
        );
    }

    async init(message: Message) {
        const embed = Embed.success()
            .setAuthor('GetPocket', null, 'https://app.getpocket.com/')
            .setDescription(`
            Connect your Pocket account to Khafra-Bot to get updates on the latest news.
            
            Examples:
            \`\`pocketinit\`\` - Start the process of authorizing your Pocket account.
            `);

        return message.channel.send(embed);
    }
}