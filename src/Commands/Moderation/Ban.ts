import { Command } from '../../Structures/Command';
import { Message, GuildMember } from 'discord.js';
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
        }

        const [ userType, time, ...reason ] = args;
        // days of messages to clear
        const realTime = Math.round((ms(time) ?? 0) / 86400000);
        const realReason = realTime === 0 ? [time].concat(reason) : reason;

        if(!/(<@!)?\d{17,19}>?/.test(userType)) {
            return message.channel.send(Embed.fail(`
            No guild member mentioned and no user ID provided.
            `));
        } else if(realTime > 7) {
            // max 7 days or an error will be thrown
            return message.channel.send(Embed.missing_args.call(this, 2, 'Only 7 days of messages can be cleared max!'));
        }

        let member: GuildMember;
        try {
            member = await message.guild.members.fetch(args[0].replace(/[^\d]/g, ''));
        } catch {
            return message.channel.send(Embed.fail('Invalid ID provided or member mentioned!'));
        }

        try {
            await message.guild.members.ban(member.user, {
                reason: realReason.length > 0 ? realReason.join(' ') : null,
                days: realTime
            });
        } catch {
            return message.channel.send(Embed.fail(`${member} isn't bannable!`));
        }

        return message.channel.send(Embed.success(`
        ${member} has been banned from the server!

        ${realTime} days worth of messages have been cleared from them.
        `));
    }
}