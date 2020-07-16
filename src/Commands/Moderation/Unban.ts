import Command from '../../Structures/Command';
import { Message, User, MessageEmbed } from 'discord.js';

export default class extends Command {
    constructor() {
        super(
            'unban',
            'Unban a user from the guild.',
            [ 'SEND_MESSAGES', 'BAN_MEMBERS', 'EMBED_LINKS' ]
        );
    }

    async init(message: Message, args: string[]): Promise<Message> {
        if(!super.hasPermissions(message)) {
            return message.channel.send(this.failEmbed(`
            One of us doesn't have the needed permissions!

            Both of us must have \`\`${this.permissions.join(', ')}\`\` permissions to use this command!
            `));
        } else if(args.length === 0) {
            return message.channel.send(this.failEmbed(`
            Missing at least 1 argument!

            Examples:
            \`\`unban 1234567891234567 for apologizing\`\`
            \`\`unban 1234567891234567\`\`
            `));
        }

        const [id, ...reason] = args.length > 1 ? args : [args].flat();
        let user: User;
        try {
            user = await message.client.users.fetch(id);
            await message.guild.members.unban(user, reason.join(' '));
        } catch(e) {
            return message.channel.send(this.failEmbed(`
            Invalid User!
            \`\`${e}\`\`
            `));
        }

        return message.channel.send(this.formatEmbed(user, reason.join(' ')));
    }

    formatEmbed(user: User, reason?: string): MessageEmbed {
        const embed = new MessageEmbed()
            .setDescription(`
            **Successfully** unbanned ${user}${reason.length ? ' for \`\`' + reason : '\`\`'}!
            `);

        return embed;
    }
}