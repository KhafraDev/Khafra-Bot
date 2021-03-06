import { Command, Arguments } from '../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { unbans } from '../../lib/Cache/Unban.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Unban a user from the guild.',
                '1234567891234567 for apologizing',
                '9876543217654321'
            ],
			{
                name: 'unban',
                folder: 'Moderation',
                args: [1],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.BAN_MEMBERS ]
            }
        );
    }

    async init(message: Message, { args }: Arguments) {
        const user = await getMentions(message, 'users');

        if (!user) 
            return this.Embed.fail('Invalid ID or the user couldn\'t be fetched, sorry! 😕');

        try {
            await message.guild.members.unban(user, args.slice(1).join(' '));
        } catch (e) {
            return this.Embed.fail(`Couldn't unban ${user}, try again?\n\`\`${e}\`\``);
        } finally {
            if (hasPerms(message.channel, message.guild.me, Permissions.FLAGS.VIEW_AUDIT_LOG))
                if (!unbans.has(`${message.guild.id},${user.id}`))
                    unbans.set(`${message.guild.id},${user.id}`, message.member);
        }

        return this.Embed.success(`${user} is now unbanned!`);
    }
}