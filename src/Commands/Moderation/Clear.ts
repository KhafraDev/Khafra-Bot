import { Command } from '../../Structures/Command.js';
import { Message, TextChannel, NewsChannel, Permissions } from 'discord.js';
import { isValidNumber } from '../../lib/Utility/Valid/Number.js';


export default class extends Command {
    constructor() {
        super(
            [
                'Clear messages from a given channel.',
                '100', '53'
            ], 
            {
                name: 'clear',
                folder: 'Moderation',
                aliases: [ 'bulkdelete' ],
                args: [1, 1],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.MANAGE_MESSAGES ]
            }
        );
    }

    async init(message: Message, args: string[]) {
        const toDelete = +args.shift() + 1;
        if(!isValidNumber(toDelete)) {
            return message.reply(this.Embed.fail(`
            Received: ${toDelete}, this command requires a valid integer!

            Example: \`\`${this.settings.name} 100\`\`
            `));
        }

        const channel = (message.mentions.channels.size > 0 ? message.mentions.channels.first() : message.channel) as TextChannel | NewsChannel;
        const deleted = await channel.bulkDelete(toDelete > 100 ? 100 : toDelete, true);

        const embed = this.Embed.success()
            .setAuthor(message.client.user.username, message.client.user.displayAvatarURL())
            .setTimestamp()
            .setFooter(`Requested by ${message.author.tag}!`)
            .setDescription(`
            Successfully deleted ${deleted.size} messages!

            \`\`If this number isn't correct, it is because messages older than 2 weeks cannot be cleared and your input message has also been deleted.\`\`
            `);

        return message.reply(embed)
            .then(m => m?.delete({ timeout: 5000 }))
    }
}