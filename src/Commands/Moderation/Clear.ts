import Command from '../../Structures/Command';
import { Message, TextChannel, MessageEmbed } from 'discord.js';

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
            return message.channel.send(this.failEmbed(`
            One of us doesn't have the needed permissions!

            Both of us must have \`\`${this.permissions.join(', ')}\`\` permissions to use this command!
            `));
        } else if(args.length < 1) { // clear [amount] -> 1 arg meeded
            return message.channel.send(this.failEmbed(`
            1 argument is required!

            Some examples to help you start:
            \`\`${this.name} 100\`\`
            \`\`${this.name} 250\`\` -> 200 messages deleted
            `));
        } 
        
        const toDelete = parseInt(args.shift());
        if(isNaN(toDelete)) {
            return message.channel.send(this.failEmbed(`
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

        const embed = new MessageEmbed()
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