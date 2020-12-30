import { Command } from '../../Structures/Command.js';
import { Message, TextChannel, Permissions } from 'discord.js';
import { getMentions, validSnowflake } from '../../lib/Utility/Mentions.js';
import ms from 'ms';
import { isValidNumber } from '../../lib/Utility/Valid/Number.js';
import { GuildSettings } from '../../lib/types/Collections.js';

export default class extends Command {
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

    async init(message: Message, args: string[], settings: GuildSettings) {
        const idOrUser = getMentions(message, args);
        if(!idOrUser) {
            return message.reply(this.Embed.generic('Invalid member ID!'))
        } else if(typeof idOrUser === 'string') {
            if(!validSnowflake(idOrUser) || !idOrUser) {
                return message.reply(this.Embed.generic('Invalid user ID!'));
            }
        } else {
            const member = message.guild.members.resolve(idOrUser);
            if(member && !member.bannable) {
                return message.reply(this.Embed.fail(`:( ${idOrUser} isn't bannable!`));
            }
        }

        const clear = typeof args[1] === 'string' ? Math.ceil(ms(args[1]) / 86400000) : 7;

        const msg = await message.reply(this.Embed.success(`
        Are you sure you want to ban ${idOrUser}?

        Answer "\`\`yes\`\`" to ban and "\`\`no\`\`" to cancel.
        `));

        if(!msg) {
            return;
        }

        const filter = (m: Message) => 
            m.author.id === message.author.id &&
            ['yes', 'no', 'y', 'n', 'cancel', 'stop'].includes(m.content.toLowerCase());

        const m = await message.channel.awaitMessages(filter, {
            max: 1,
            time: 20000
        });

        if(m.size === 0) {
            return msg.edit(this.Embed.fail(`Didn't get confirmation to ban ${idOrUser}!`));
        } else if(['no', 'n', 'cancel', 'stop'].includes(m.first()?.content?.toLowerCase())) {
            return msg.edit(this.Embed.fail('Command was canceled!'));
        }

        const reason = args.slice(args[1] && ms(args[1]) ? 2 : 1).join(' ');
        try {
            await message.guild.members.ban(idOrUser, {
                days: isValidNumber(clear) ? clear : 7,
                reason
            });
        } catch {
            return message.reply(this.Embed.fail(`${idOrUser} isn't bannable!`));
        }

        await message.reply(this.Embed.success(`
        ${idOrUser} has been banned from the guild and ${Number.isNaN(clear) ? '7' : clear} days worth of messages have been removed.
        `));

        if(typeof settings?.modActionLogChannel === 'string') {
            const channel = message.guild.channels.cache.get(settings.modActionLogChannel) as TextChannel;
            if(channel?.type !== 'text') {
                return;
            } else if(!channel.permissionsFor(message.guild.me).has([ 'SEND_MESSAGES', 'EMBED_LINKS' ])) {
                return;
            }

            return channel.send(this.Embed.success(`
            **Offender:** ${idOrUser}
            **Reason:** ${reason.length > 0 ? reason.slice(0, 100) : 'No reason given.'}
            **Staff:** ${message.member}
            `).setTitle('Member Banned'));
        }
    }
}