import { Command, Arguments } from '../../Structures/Command.js';
import { Message, Permissions, GuildMember, User, Snowflake } from 'discord.js';
import { validSnowflake } from '../../lib/Utility/Mentions.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { bans } from '../../lib/Cache/Bans.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';

@RegisterCommand
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

    async init(message: Message, { args }: Arguments) {
        if (args.some(id => !validSnowflake(id as Snowflake)))
            return this.Embed.fail(`One or more ❄️❄️❄️ are invalid!`);

        const promiseArr = args.map(id => {
            return async () => {
                const type = await message.guild.members.ban(id as Snowflake, {
                    reason: `Force-ban by ${message.author.id} (${message.author.tag}).`
                });

                if (hasPerms(message.channel, message.guild.me, Permissions.FLAGS.VIEW_AUDIT_LOG))
                    if (!bans.has(`${message.guild.id},${id}`)) // not in the cache already, just to be sure
                        bans.set(`${message.guild.id},${id}`, message.member);

                return type;
            }
        });

        const resolved = await Promise.allSettled(promiseArr.map(p => p()));
        const good = resolved.filter(p => p.status === 'fulfilled') as PromiseFulfilledResult<string | User | GuildMember>[];
        const goodFormat = good.map(x => typeof x.value === 'string' ? `\`\`${x.value}\`\`` : `${x.value}`).join(', ');

        return this.Embed.success(`
        Banned ${good.length} members (out of ${args.length} requested).
        ${goodFormat}
        `);
    }
}