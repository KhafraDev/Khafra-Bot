import Command from '../../Structures/Command';
import { Message, TextChannel, MessageEmbed } from 'discord.js';
import Embed from '../../Structures/Embed';

export default class extends Command {
    constructor() {
        super(
            'clear', 
            'Clear messages from a given channel.', 
            [ 'MANAGE_MESSAGES', 'SEND_MESSAGES', 'EMBED_LINKS' ]
        );
    }

    async init(message: Message, args: string[]): Promise<Message> {
        if(!super.hasPermissions(message)) {
            return message.channel.send(Embed.missing_perms(this.permissions));
        } else if(args.length < 1) { // clear [amount] -> 1 arg meeded
            return message.channel.send(Embed.missing_args(1, this.name, [
                '100',
                '250'
            ]));
        } 
        
        const toDelete = +args.shift();
        if(isNaN(toDelete)) {
            return message.channel.send(Embed.fail(`
            Received: ${toDelete}, this command requires a number!

            Example: \`\`${this.name} 100\`\`
            `));
        }

        const channel = message.mentions.channels.size > 0 ? message.mentions.channels.first() : message.channel;
        const deleted = await (channel as TextChannel).bulkDelete(toDelete > 200 ? 200 : toDelete);
        return message.channel.send(this.formatEmbed(message, deleted.size));
    }

    formatEmbed(message: Message, deleted: number): MessageEmbed {
        const icon = message.client.user.avatarURL() ?? message.client.user.defaultAvatarURL;

        const embed = Embed.success()
            .setAuthor(message.client.user.username, icon)
            .setTimestamp()
            .setFooter(`Requested by ${message.author.tag}!`)
            .setDescription(`
            Successfully deleted ${deleted} messages!

            \`\`If this number isn't correct, it is because messages older than 2 weeks cannot be cleared.\`\`
            `);

        return embed;
    }
}