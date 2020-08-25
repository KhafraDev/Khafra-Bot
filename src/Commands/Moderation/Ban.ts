import { Command } from '../../Structures/Command';
import { Message, GuildMember } from 'discord.js';
import Embed from '../../Structures/Embed';
import ms from 'ms';

export default class extends Command {
    constructor() {
        super(
            [
                'Ban a member from the guild.',
                '@user 1d12h1800m for a good reason',
                '@user 0 bye!',
                '239566240987742220 14d'
            ],
            [ 'BAN_MEMBERS' ],
            {
                name: 'ban', 
                folder: 'Moderation',
                aliases: [ 'bna' ],
                cooldown: 5,
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(Embed.missing_perms.call(this));
        } else if(args.length < 3) { // ban @user 3d1h trolling -> 3+ args
            return message.channel.send(Embed.missing_args.call(this, 3));
        }

        const [ user, time, ...reason ] = args;
        // days of messages to clear
        const realTime = (ms(time) ?? 0) / 86400000;
        
        let member: GuildMember = message.mentions.members.first();
        if(!member) {
            try {
                member = await message.guild.members.fetch(user);
            } catch {
                return message.channel.send(Embed.fail(`
                *${user}* is not a valid member!

                Examples:
                \`\`kick @user for trolling\`\`
                \`\`kick 1234567891234567\`\`
                `));
            }
        }

        if(!member.bannable) {
            return message.channel.send(Embed.fail(`${member} is not bannable!`));
        }

        await member.ban({
            days: realTime,
            reason: reason?.join(' ')
        });

        const embed = Embed.success()
            .setAuthor(message.client.user.username, message.client.user.displayAvatarURL())
            .setTimestamp()
            .setFooter(`Requested by ${message.author.tag}!`)
            .setDescription(`
            Successfully banned ${member} and cleared ${realTime} days of messages!

            ${reason.length === 0 ? '' : reason.join(' ').length > 1000 ? reason.join(' ') + '...' : reason.join(' ')} 
            `);

        return message.channel.send(embed);
    }
}