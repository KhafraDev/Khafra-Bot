import { Command } from '../../Structures/Command';
import { Message, User } from 'discord.js';
import Embed from '../../Structures/Embed';
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
                args: [2],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(Embed.missing_perms.call(this));
        } else if(args.length < 2) {
            return message.channel.send(Embed.missing_args.call(this, 2));
        }

        const [ userType, time, ...reason ] = args;
        // days of messages to clear
        const realTime = Math.round((ms(time) ?? 0) / 86400000);
        const realReason = realTime === 0 ? [time].concat(reason) : reason;

        if(!/<?@?!?\d{17,19}>?/.test(userType)) {
            return message.channel.send(Embed.missing_args.call(this, 2, 'Invalid User ID or mention!'));
        } else if(realTime > 7) {
            // max 7 days or an error will be thrown
            return message.channel.send(Embed.missing_args.call(this, 2, 'Only 7 days of messages can be cleared max!'));
        }

        const mentions = message.mentions.members;
        let user: User;
        // only 1 member mentioned and the mention isn't the bot itself.
        if(
            (mentions.size === 1 && mentions.first().id === message.guild.me.id)
            || (mentions.size === 0 && !isNaN(+userType) && userType.length >= 17 && userType.length <= 19)
        ) {
            try {
                user = await message.client.users.fetch(userType.replace(/[^0-9]/g, ''));
            } catch(e) {
                this.logger.log(e.toString());
                return message.channel.send(Embed.fail('No user found!'));
            }
        } else if(mentions.size > 1) { // @KhafraBot#0001 kick @user#0001 blah - @Mod#0001
            user = mentions.first().id === message.guild.me.id ? mentions.first(2).pop().user : mentions.first().user;
        }
        
        if(!(user instanceof User)) {
            return message.channel.send(Embed.fail('No user found!'));
        }

        try {
            await message.guild.members.ban(user, {
                reason: realReason.length > 0 ? realReason.join(' ') : null,
                days: realTime
            });
            return message.channel.send(Embed.success(`
            ${user} has been banned for \`\`${realReason.length ? realReason.join(' ').slice(0, 100) : 'No reason given'}\`\`.

            ${realTime} days worth of messages have been cleared from them.
            `));
        } catch {
            return message.channel.send(Embed.fail(`${user} isn't bannable!`));
        }
    }
}