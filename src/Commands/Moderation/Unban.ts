import { Command } from '../../Structures/Command';
import { Message, User } from 'discord.js';
import Embed from '../../Structures/Embed';

export default class extends Command {
    constructor() {
        super(
            'unban',
            [
                'Unban a user from the guild.',
                '1234567891234567 for apologizing',
                '9876543217654321'
            ],
            [ 'BAN_MEMBERS' ],
            10
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(Embed.missing_perms(this.permissions));
        } else if(args.length < 1) {
            return message.channel.send(Embed.missing_args(1, this.name, this.help.slice(1)));
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

        const embed = Embed.success(`
        **Successfully** unbanned ${user}${reason.join(' ').length ? ' for \`\`' + reason.join(' ') + '\`\`' : ''}!
        `);

        return message.channel.send(embed);
    }
}