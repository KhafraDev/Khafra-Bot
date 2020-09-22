import { Command } from '../../Structures/Command';
import { Message, User } from 'discord.js';


export default class extends Command {
    constructor() {
        super(
            [
                'Unban a user from the guild.',
                '1234567891234567 for apologizing',
                '9876543217654321'
            ],
            [ 'BAN_MEMBERS' ],
            {
                name: 'unban',
                folder: 'Moderation',
                args: [1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(this.Embed.missing_perms());
        }

        const [id, ...reason] = args.length > 1 ? args : [args].flat();
        let user: User;
        try {
            user = await message.client.users.fetch(id);
            await message.guild.members.unban(user, reason?.join(' '));
        } catch {
            return message.channel.send(this.Embed.fail('Invalid User!'));
        }

        const embed = this.Embed.success(`
        **Successfully** unbanned ${user}${reason.join(' ').length ? ' for \`\`' + reason.join(' ') + '\`\`' : ''}!
        `);

        return message.channel.send(embed);
    }
}