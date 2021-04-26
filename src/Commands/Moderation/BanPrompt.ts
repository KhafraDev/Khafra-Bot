import { Command, Arguments } from '../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import ms from 'ms';
import { isValidNumber } from '../../lib/Utility/Valid/Number.js';
import { hierarchy } from '../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Ban a member from the guild, prompts you for confirmation first.',
                '@user 3d for a good reason',
                '@user 0 bye!',
                '239566240987742220 7d'
            ],
			{
                name: 'banprompt', 
                folder: 'Moderation',
                aliases: [ 'bnaprompt' ],
                args: [1],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.BAN_MEMBERS ]
            }
        );
    }

    async init(message: Message, { args }: Arguments) {
        const user = await getMentions(message, 'users');
        const clear = typeof args[1] === 'string' ? Math.ceil(ms(args[1]) / 86400000) : 7;

        const member = message.guild.members.resolve(user);
        if (member && !hierarchy(message.member, member)) {
            return this.Embed.fail(`You do not have permission to ban ${member}!`);
        } else if (!user) {
            return this.Embed.fail(`No user id or user mentioned, no one was banned.`);
        }

        const msg = await message.reply(this.Embed.success(`
        Are you sure you want to ban ${user}?

        Answer "\`\`yes\`\`" to ban and "\`\`no\`\`" to cancel.
        `));

        const filter = (m: Message) => 
            m.author.id === message.author.id &&
            ['yes', 'no', 'y', 'n', 'cancel', 'stop'].includes(m.content.toLowerCase())
        ;

        const m = await message.channel.awaitMessages(filter, {
            max: 1,
            time: 20000
        });

        if (m.size === 0) {
            return msg.edit(this.Embed.fail(`Didn't get confirmation to ban ${user}!`));
        } else if (['no', 'n', 'cancel', 'stop'].includes(m.first()?.content.toLowerCase())) {
            return msg.edit(this.Embed.fail('Command was canceled!'));
        }

        const reason = args.slice(args[1] && ms(args[1]) ? 2 : 1).join(' ');
        try {
            await message.guild.members.ban(user, {
                days: isValidNumber(clear) ? clear : 7,
                reason
            });
        } catch {
            return this.Embed.fail(`${user} isn't bannable!`);
        }

        await message.reply(this.Embed.success(`
        ${user} has been banned from the guild and ${Number.isNaN(clear) ? '7' : clear} days worth of messages have been removed.
        `));
    }
}