import { Command } from '../../Structures/Command';
import { Message, TextChannel, NewsChannel } from 'discord.js';


export default class extends Command {
    constructor() {
        super(
            [
                'Clear messages from a given channel.',
                '100', '53'
            ], 
            [ 'MANAGE_MESSAGES' ],
            {
                name: 'clear',
                folder: 'Moderation',
                aliases: [ 'bulkdelete' ],
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(this.Embed.missing_perms());
        }
        
        const toDelete = +args.shift() + 1;
        if(Number.isNaN(toDelete) || !Number.isSafeInteger(toDelete)) {
            return message.channel.send(this.Embed.fail(`
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

        return message.channel.send(embed)
            .then(m => m.delete({ timeout: 5000 }))
    }
}