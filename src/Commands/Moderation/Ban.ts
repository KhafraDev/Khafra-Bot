import { Command } from '../../Structures/Command';
import { Message } from 'discord.js';
import ms from 'ms';

export default class extends Command {
    constructor() {
        super(
            [
                'Ban a member from the guild.',
                '@user 3d for a good reason',
                '@user 0 bye!',
                '239566240987742220 7d'
            ],
            [ 'BAN_MEMBERS' ],
            {
                name: 'ban', 
                folder: 'Moderation',
                aliases: [ 'bna' ],
                args: [1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(this.Embed.missing_perms.call(this));
        }

        const user = message.mentions.users.filter(u => u.id !== message.guild.me.id).first();
        const id = !isNaN(+args[0]) 
            ? args[0]
            : user?.id;
        const clear = Math.round((ms(args[1] ?? '7d') ?? ms('7d')) / 86400000); // defaults to 7d worth of messages clearing

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
        Are you sure you want to ban ${user ?? id}?

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
                days: parseInt(clear.toString()),
                reason: args.slice(args[1] && ms(args[1]) ? 2 : 1).join(' ')
            });
        } catch(e) {
            console.log(e);
            return message.channel.send(this.Embed.fail(`${user ?? id} isn't bannable!`));
        }

        return message.channel.send(this.Embed.success(`
        ${user ?? id} has been banned from the guild and ${clear} days worth of messages have been removed.
        `));
    }
}