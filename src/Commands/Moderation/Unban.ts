import { Command, Arguments } from '#khaf/Command';
import { Message, Permissions } from 'discord.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { inlineCode } from '@khaf/builders';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';

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

    async init(message: Message<true>, { args, cli }: Arguments) {
        const user = await getMentions(message, 'users');

        if (!user) 
            return this.Embed.error('Invalid ID or the user couldn\'t be fetched, sorry! 😕');

        const reasonAny = cli.has('reason') || cli.has('r')
            ? (cli.get('reason') || cli.get('r'))
            : args.slice(1).join(' ');

        const reason = typeof reasonAny === 'string' ? reasonAny : '';

        const [e] = await dontThrow(message.guild.members.unban(user, reason));

        if (e !== null) {
            return this.Embed.error(`Couldn't unban ${user}, try again?\n${inlineCode(`${e}`)}`);
        }

        return this.Embed.ok(`${user} is now unbanned!`);
    }
}