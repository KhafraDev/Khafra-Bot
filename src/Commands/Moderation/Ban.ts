import { Command, Arguments } from '../../Structures/Command.js';
import { Permissions } from 'discord.js';
import ms from 'ms';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { hasPerms, hierarchy } from '../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { bans } from '../../lib/Cache/Bans.js';
import { Range } from '../../lib/Utility/Range.js';
import { validateNumber } from '../../lib/Utility/Valid/Number.js';
import { Message } from '../../lib/types/Discord.js.js';

const range = Range(0, 7, true);

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Ban a member from the guild.',
                '@user 3d for a good reason',
                '@user 0 bye!',
                '239566240987742220 7d'
            ],
			{
                name: 'ban', 
                folder: 'Moderation',
                aliases: [ 'bna' ],
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

        const reason = args.slice(args[1] && ms(args[1]) ? 2 : 1).join(' ');
        try {
            await message.guild.members.ban(user, {
                days: range.isInRange(clear) && validateNumber(clear) ? clear : 7,
                reason
            });
            
            // TODO(@KhafraDev): check if this perm requires any intents/perms
            if (hasPerms(message.channel, message.guild.me, Permissions.FLAGS.VIEW_AUDIT_LOG))
                if (!bans.has(`${message.guild.id},${user.id}`)) // not in the cache already, just to be sure
                    bans.set(`${message.guild.id},${user.id}`, { member: message.member, reason });
        } catch {
            return this.Embed.fail(`${user} isn't bannable!`);
        }

        return this.Embed.success(`
        ${user} has been banned from the guild and ${Number.isNaN(clear) ? '7' : clear}` +
        ` days worth of messages have been removed.
        `);
    }
}