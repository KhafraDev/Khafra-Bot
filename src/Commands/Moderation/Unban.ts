import { Command, Arguments } from '../../Structures/Command.js';
import { Permissions } from 'discord.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { unbans } from '../../lib/Cache/Unban.js';
import { Message } from '../../lib/types/Discord.js.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Unban a user from the guild.',
                '1234567891234567 for apologizing',
                '9876543217654321',
                '1234567891234567 --reason apologized nicely :)'
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

    async init(message: Message, { args, cli }: Arguments) {
        const user = await getMentions(message, 'users');

        if (!user) 
            return this.Embed.fail('Invalid ID or the user couldn\'t be fetched, sorry! 😕');

        const reasonAny = cli.has('reason') || cli.has('r')
            ? (cli.get('reason') || cli.get('r'))
            : args.slice(1).join(' ');

        const reason = typeof reasonAny === 'string' ? reasonAny : '';

        try {
            await message.guild.members.unban(user, reason);

            if (!unbans.has(`${message.guild.id},${user.id}`))
                unbans.set(`${message.guild.id},${user.id}`, { member: message.member, reason });
        } catch (e) {
            return this.Embed.fail(`Couldn't unban ${user}, try again?\n\`\`${e}\`\``);
        }

        return this.Embed.success(`${user} is now unbanned!`);
    }
}