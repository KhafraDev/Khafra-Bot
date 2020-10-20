import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { isValidNumber } from '../../lib/Utility/Valid/Number.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Softban a member (bans and instantly unbans them, clearing recent messages).',
                '@user for a good reason',
                '@user bye!',
                '239566240987742220'
            ],
            [ 'BAN_MEMBERS' ],
            {
                name: 'softban', 
                folder: 'Moderation',
                aliases: [ 'softbna' ],
                args: [1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(this.Embed.missing_perms());
        }

        const user = message.mentions.users.filter(u => u.id !== message.guild.me.id).first();
        const id = isValidNumber(+args[0], { allowUnsafe: true })
            ? args[0]
            : user?.id;

        if(!id) {
            return message.channel.send(this.Embed.generic(
                'Invalid user mentioned or ID provided in the first argument!'
            ));
        } else if(user) {
            const member = message.guild.member(user);
            if(member && !member.bannable) {
                return message.channel.send(this.Embed.fail(`:( ${user} isn't bannable!`));
            }
        }

        const msg = await message.channel.send(this.Embed.success(`
        Are you sure you want to softban ${user ?? id}?

        Answer "\`\`yes\`\`" to ban and "\`\`no\`\`" to cancel.
        `));

        if(!msg) {
            return;
        }

        const filter = (m: Message) => m.author.id === message.author.id &&
                                       ['yes', 'no', 'y', 'n', 'cancel', 'stop'].includes(m.content?.toLowerCase());
        const m = await message.channel.awaitMessages(filter, {
            max: 1,
            time: 20000
        });

        if(m.size === 0) {
            return msg.edit(this.Embed.fail(`Didn't get confirmation to ban ${user ?? id}!`));
        } else if(['no', 'n', 'cancel', 'stop'].includes(m.first()?.content?.toLowerCase())) {
            return msg.edit(this.Embed.fail('Command was canceled!'));
        }

        try {
            await message.guild.members.ban(id, {
                days: 7,
                reason: args.slice(1).join(' ')
            });
            await message.guild.members.unban(id, 'Khafra-Bot softbanned.');
        } catch {
            return message.channel.send(this.Embed.fail(`${user ?? id} isn't bannable!`));
        }

        return message.channel.send(this.Embed.success(`
        ${user ?? id} has been softbanned from the guild, 7 days worth of messages from them have been cleared.
        `));
    }
}