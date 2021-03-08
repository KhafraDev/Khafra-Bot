import { Command } from '../../Structures/Command.js';
import { Message, Permissions, GuildMember, User, TextChannel } from 'discord.js';
import { validSnowflake } from '../../lib/Utility/Mentions.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { GuildSettings } from '../../lib/types/Collections.js';
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
                aliases: [ 'forcebna', 'forceban' ],
                args: [1, 10],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.BAN_MEMBERS ]
            }
        );
    }

    async init(message: Message, args: string[], settings: GuildSettings) {
        if (args.some(id => !validSnowflake(id)))
            return this.Embed.fail(`One or more ❄️❄️❄️ are invalid!`);

        const promiseArr = args.map(id => message.guild.members.ban(id, {
            reason: `Force-ban by ${message.author.id} (${message.author.tag}).`
        }));

        const resolved = await Promise.allSettled(promiseArr);
        const good = resolved.filter(p => p.status === 'fulfilled') as PromiseFulfilledResult<string | User | GuildMember>[];
        const goodFormat = `\`\`${good.map(x => typeof x.value === 'string' ? x.value : x.value.id).join('``, ``')}\`\``;

        await message.reply(this.Embed.success(`
        Banned ${good.length} members (out of ${args.length} requested).
        ${goodFormat}
        `));

        if (typeof settings?.modActionLogChannel === 'string') {
            const channel = message.guild.channels.cache.get(settings.modActionLogChannel) as TextChannel;
            
            if (!hasPerms(channel, message.guild.me, [ Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS ]))
                return;

            return channel.send(this.Embed.success(`
            **Offenders:** ${goodFormat}
            **Staff:** ${message.member}
            `).setTitle('Members Banned'));
        }
    }
}