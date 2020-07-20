import Command from '../../Structures/Command';
import { Message, User } from 'discord.js';
import Embed from '../../Structures/Embed';

export default class extends Command {
    constructor() {
        super(
            'unban',
            'Unban a user from the guild.',
            [ 'SEND_MESSAGES', 'BAN_MEMBERS', 'EMBED_LINKS' ]
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(Embed.missing_perms(this.permissions));
        } else if(args.length < 1) {
            return message.channel.send(Embed.missing_args(1, this.name, [
                '1234567891234567 for apologizing',
                '9876543217654321'
            ]));
        }

        const [id, ...reason] = args.length > 1 ? args : [args].flat();
        let user: User;
        try {
            user = await message.client.users.fetch(id);
            await message.guild.members.unban(user, (reason || []).join(' '));
        } catch(e) {
            return message.channel.send(Embed.fail(`
            Invalid User!
            \`\`${e}\`\`
            `));
        }

        return message.channel.send(this.formatEmbed(user, reason.join(' ')));
    }

    formatEmbed(user: User, reason?: string) {
        const embed = Embed.success(`
        **Successfully** unbanned ${user}${reason.length ? ' for \`\`' + reason + '\`\`' : ''}!
        `);

        return embed;
    }
}