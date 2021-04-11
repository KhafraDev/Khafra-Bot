import { Command, Arguments } from '../../Structures/Command.js';
import { Message, TextChannel, Permissions } from 'discord.js';
import { isValidNumber } from '../../lib/Utility/Valid/Number.js';
import ms from 'ms';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { GuildSettings } from '../../lib/types/Collections.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Softban a member (bans and instantly unbans them, clearing recent messages).',
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

    async init(message: Message, { args }: Arguments, settings: GuildSettings) {
        const member = await getMentions(message, 'users');
        if (!member) {
            return this.Embed.fail('No user mentioned and/or an invalid ❄️ was used!');
        }

        const clear = typeof args[1] === 'string' ? Math.ceil(ms(args[1]) / 86400000) : 7;
        const reason = args.slice(args[1] && ms(args[1]) ? 2 : 1).join(' ');
        const msg = await message.reply(this.Embed.success(`
        Are you sure you want to ban ${member}?

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
            return msg.edit(this.Embed.fail(`Didn't get confirmation to ban ${member}!`));
        } else if (['no', 'n', 'cancel', 'stop'].includes(m.first()?.content.toLowerCase())) {
            return msg.edit(this.Embed.fail('Command was canceled!'));
        }

        try {
            await message.guild.members.ban(member, {
                days: isValidNumber(clear) ? clear : 7,
                reason
            });
            await message.guild.members.unban(member, `Khafra-Bot: softban by ${message.author.tag} (${message.author.id})`);
        } catch {
            return this.Embed.fail(`${member} isn't bannable!`);
        }

        await message.reply(this.Embed.success(`
        ${member} has been soft-banned from the guild!
        `));

        if (typeof settings?.modActionLogChannel === 'string') {
            const channel = message.guild.channels.cache.get(settings.modActionLogChannel) as TextChannel;
            
            if (!hasPerms(channel, message.guild.me, [ Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS ]))
                return;

            return channel.send(this.Embed.success(`
            **Offender:** ${member}
            **Reason:** ${reason.length > 0 ? reason.slice(0, 100) : 'No reason given.'}
            **Staff:** ${message.member}
            `).setTitle('Member Soft-Banned'));
        }
    }
}