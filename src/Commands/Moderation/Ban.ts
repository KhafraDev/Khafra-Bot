import Command from '../../Structures/Command';
import { Message, MessageEmbed } from 'discord.js';
import Embed from '../../Structures/Embed';

export default class extends Command {
    constructor() {
        super(
            'ban',
            'Ban a member from a guild.',
            [ 'BAN_MEMBERS', 'SEND_MESSAGES', 'EMBED_LINKS' ],
            [ 'bna' ]
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(Embed.missing_perms(this.permissions));
        } else if(!message.member.bannable) {
            return message.channel.send(Embed.fail('Member is not bannable!'));
        } else if(message.mentions.members.size < 1) {
            return message.channel.send(Embed.fail('No users mentioned!'));
        } else if(args.length < 3) { // ban @user 3d1h trolling -> 3+ args
            return message.channel.send(Embed.missing_args(3, this.name, [
                '@user 1d12h1800m for a good reason',
                '@user 0 bye!'
            ]));
        }

        const [ user, time, ...reason ] = args;
        const realTime = this.parseTime(time) ?? 0;
        if(user.replace(/[^\d+]/g, '') !== message.mentions.members.first().toString().replace(/[^\d+]/g, '')) {
            return message.channel.send(Embed.fail('User was not the same as mentioned!'));
        }

        await message.mentions.members.first().ban({
            days: realTime > 14 ? 14 : realTime,
            reason: (reason || []).join(' ')
        });

        return message.channel.send(this.formatEmbed(message, user, realTime, (reason || []).join(' ')));
    }

    parseTime(time: string): number | null {
        const b = time.match(/\d+[\s+A-z]|\d+.\d+[\s+A-z]/gi);
        const c = b.map(d => {
            const unit = d.replace(/[^A-z]/g, '');
            const time = parseFloat(d.replace(/[^0-9.]/g, ''));

            switch(unit.toLowerCase()) {
                case 'd': return time       ;
                case 'h': return time / 24  ;
                case 'm': return time / 3600;
            }
        });

        return c.every(n => !isNaN(n)) ? Math.round(c.reduce((a, b) => a + b)) : null;
    }

    formatEmbed(message: Message, user: string, time: number, reason: string): MessageEmbed {
        const icon = message.client.user.avatarURL() ?? message.client.user.defaultAvatarURL;

        const embed = Embed.success()
            .setAuthor(message.client.user.username, icon)
            .setTimestamp()
            .setFooter(`Requested by ${message.author.tag}!`)
            .setDescription(`
            Successfully banned ${user} and cleared ${time} days of messages! ${reason.length > 0 ? 'They were banned for: ``' + reason + '``' : 'No reason given.'}

            Delete messages from the user with higher precision! 
            Put 0 as time to keep all messages.
            \`\`${this.name} @user 1d12h1800m trolling\`\`
            \`\`${this.name} @user 3d900m18h for a good reason!\`\`
            \`\`${this.name} @user invalid for a bad reason\`\` -> 0 days of messages deleted
            `);

        return embed;
    }
}