import { Command, Arguments } from '../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import ms from 'ms';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { bans } from '../../lib/Cache/Bans.js';
import { Range } from '../../lib/Utility/Range.js';
import { validateNumber } from '../../lib/Utility/Valid/Number.js';

const range = Range(0, 7, true);

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Softban a member (bans and instantly unbans them; clearing recent messages).',
                '@user for a good reason',
                '@user bye!',
                '239566240987742220'
            ],
			{
                name: 'softban', 
                folder: 'Moderation',
                aliases: [ 'softbna' ],
                args: [1],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.BAN_MEMBERS ]
            }
        );
    }

    async init(message: Message, { args }: Arguments) {
        const member = await getMentions(message, 'users');
        if (!member) {
            return this.Embed.fail('No user mentioned and/or an invalid ❄️ was used!');
        }

        const clear = typeof args[1] === 'string' ? Math.ceil(ms(args[1]) / 86400000) : 7;
        const reason = args.slice(args[1] && ms(args[1]) ? 2 : 1).join(' ');

        try {
            await message.guild.members.ban(member, {
                days: range.isInRange(clear) && validateNumber(clear) ? clear : 7,
                reason
            });
            await message.guild.members.unban(member, `Khafra-Bot: softban by ${message.author.tag} (${message.author.id})`);

            if (hasPerms(message.channel, message.guild.me, Permissions.FLAGS.VIEW_AUDIT_LOG))
                if (!bans.has(`${message.guild.id},${member.id}`)) // not in the cache already, just to be sure
                    bans.set(`${message.guild.id},${member.id}`, message.member);
        } catch {
            return this.Embed.fail(`${member} isn't bannable!`);
        }

        return this.Embed.success(`
        ${member} has been soft-banned from the guild!
        `);
    }
}