import { Command } from '../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Add an emoji to the server!',
                'my_emoji [image attachment]'
            ],
			{
                name: 'addemoji',
                folder: 'Server',
                args: [1, 1],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.MANAGE_EMOJIS ]
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(message.attachments.size === 0) {
            return message.reply(this.Embed.generic('No image attached!'));
        }

        const file = message.attachments.first();
        if(!/(.png|.jpe?g|.webp|.gif)$/.test(file.url)) {
            return message.reply(this.Embed.fail(`
            Only \`\`png\`\`, \`\`jpg\`\`, \`\`webp\`\`, or \`\`gif\`\` file types allowed.
            `));
        }

        let e;
        try {
            e = await message.guild.emojis.create(
                file.url, args[0],
			{ reason: `Khafra-Bot: requested by ${message.author.tag} (${message.author.id}).` }
            );
        } catch {
            return message.reply(this.Embed.fail('An error occurred adding this emoji.'));
        }

        return message.reply(this.Embed.success(`Added ${e} to the emojis!`));
    }
}