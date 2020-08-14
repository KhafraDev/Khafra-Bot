import { Command } from '../../Structures/Command';
import { Message, TextChannel } from 'discord.js';
import Embed from '../../Structures/Embed';

export default class extends Command {
    constructor() {
        super(
            { name: 'clear', folder: 'Moderation' }, 
            [
                'Clear messages from a given channel.',
                '100', '200'
            ], 
            [ 'MANAGE_MESSAGES' ],
            10
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(Embed.missing_perms.call(this));
        } else if(args.length < 1) { // clear [amount] -> 1 arg meeded
            return message.channel.send(Embed.missing_args.call(this, 1));
        } 
        
        const toDelete = +args.shift() + 1;
        if(Number.isNaN(toDelete)) {
            return message.channel.send(Embed.fail(`
            Received: ${toDelete}, this command requires a number!

            Example: \`\`${this.name} 100\`\`
            `));
        }

        const channel = message.mentions.channels.size > 0 ? message.mentions.channels.first() : message.channel;
        const deleted = await (channel as TextChannel).bulkDelete(toDelete > 200 ? 200 : toDelete);

        const embed = Embed.success()
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