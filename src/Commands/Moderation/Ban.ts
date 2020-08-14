import { Command } from '../../Structures/Command';
import { Message, GuildMember } from 'discord.js';
import Embed from '../../Structures/Embed';

export default class extends Command {
    constructor() {
        super(
            { name: 'ban', folder: 'Moderation' },
            [
                'Ban a member from the guild.',
                '@user 1d12h1800m for a good reason',
                '@user 0 bye!',
                '239566240987742220 14d'
            ],
            [ 'BAN_MEMBERS' ],
            10,
            [ 'bna' ]
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(Embed.missing_perms.call(this));
        } else if(args.length < 3) { // ban @user 3d1h trolling -> 3+ args
            return message.channel.send(Embed.missing_args.call(this, 3));
        }

        const [ user, time, ...reason ] = args;
        const realTime = this.parseTime(time);
        
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
            days: realTime > 14 ? 14 : realTime,
            reason: (reason || []).join(' ')
        });

        const embed = Embed.success()
            .setAuthor(message.client.user.username, message.client.user.displayAvatarURL())
            .setTimestamp()
            .setFooter(`Requested by ${message.author.tag}!`)
            .setDescription(`
            Successfully banned ${member} and cleared ${realTime} days of messages! 
            ${reason.length > 0 ? 'They were banned for: ``' + reason + '``' : 'No reason given.'}
            `);

        return message.channel.send(embed);
    }

    parseTime(time: string): number {
        const b = time.match(/\d+[A-z]|\d+.\d+[A-z]/gi);
        const c = b?.map(d => {
            const unit = d.replace(/[^A-z]/g, '');
            const time = parseFloat(d.replace(/[^0-9.]/g, ''));

            switch(unit.toLowerCase()) {
                case 'd': return time       ;
                case 'h': return time / 24  ;
                case 'm': return time / 3600;
            }
        });

        return c?.every(n => !isNaN(n)) ? Math.round(c.reduce((a, b) => a + b)) : 0;
    }
}