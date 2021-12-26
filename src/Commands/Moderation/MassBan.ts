import { Command, Arguments } from '#khaf/Command';
import { Permissions, GuildMember, User, Message } from 'discord.js';
import { validSnowflake } from '#khaf/utility/Mentions.js';
import { bans } from '../../lib/Cache/Bans.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { inlineCode } from '@khaf/builders';

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Force bans a member from the guild.',
                '@user',
                '239566240987742220'
            ],
			{
                name: 'fban', 
                folder: 'Moderation',
                aliases: [ 'forcebna', 'forceban', 'massban' ],
                args: [1, 10],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.BAN_MEMBERS ]
            }
        );
    }

    async init(message: Message<true>, { args }: Arguments) {
        const ids = args.map(id => /^\d{17,19}$/.test(id) 
            ? id 
            : message.mentions.members!.get(id.replace(/[^\d]/g, ''))!
        );

        if (ids.some(id => !validSnowflake(typeof id === 'string' ? id : id?.id)))
            return this.Embed.error(`One or more ❄️❄️❄️ are invalid!`);

        const reason = `Force-ban by ${message.author.id} (${message.author.tag}).`;

        const promiseArr = ids.map(id => {
            return (async () => {
                const type = await message.guild.members.ban(id, { reason });

                if (hasPerms(message.channel, message.guild.me, Permissions.FLAGS.VIEW_AUDIT_LOG) && message.member)
                    if (!bans.has(`${message.guild.id},${id}`)) // not in the cache already, just to be sure
                        bans.set(`${message.guild.id},${id}`, { member: message.member, reason });

                return type;
            })()
        });

        const resolved = await Promise.allSettled(promiseArr);
        const good = resolved.filter(p => p.status === 'fulfilled') as PromiseFulfilledResult<string | User | GuildMember>[];
        const goodFormat = good.map(x => typeof x.value === 'string' ? inlineCode(x.value) : `${x.value}`).join(', ');

        return this.Embed.ok(`
        Banned ${good.length} members (out of ${args.length} requested).
        ${goodFormat}
        `);
    }
}