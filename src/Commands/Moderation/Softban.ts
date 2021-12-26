import { Command, Arguments } from '#khaf/Command';
import { Message, Permissions } from 'discord.js';
import { parseStrToMs } from '#khaf/utility/ms.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { bans } from '../../lib/Cache/Bans.js';
import { Range } from '#khaf/utility/Valid/Number.js';

const inRange = Range({ min: 0, max: 7, inclusive: true });

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

    async init(message: Message<true>, { args }: Arguments) {
        const member = await getMentions(message, 'users');
        if (!member) {
            return this.Embed.error('No user mentioned and/or an invalid ❄️ was used!');
        }

        const clear = typeof args[1] === 'string'
            ? Math.ceil(parseStrToMs(args[1])! / 86400000)
            : 7;
        const reason = args.slice(args[1] && parseStrToMs(args[1]) ? 2 : 1).join(' ');

        try {
            await message.guild.members.ban(member, {
                days: inRange(clear) ? clear : 7,
                reason
            });
            await message.guild.members.unban(member, `Khafra-Bot: softban by ${message.author.tag} (${message.author.id})`);

            if (hasPerms(message.channel, message.guild.me, Permissions.FLAGS.VIEW_AUDIT_LOG) && message.member)
                if (!bans.has(`${message.guild.id},${member.id}`)) // not in the cache already, just to be sure
                    bans.set(`${message.guild.id},${member.id}`, { member: message.member, reason });
        } catch {
            return this.Embed.error(`${member} isn't bannable!`);
        }

        return this.Embed.ok(`
        ${member} has been soft-banned from the guild!
        `);
    }
}