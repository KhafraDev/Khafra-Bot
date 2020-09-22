import { Command } from '../../Structures/Command';
import { Message, GuildMember, Activity } from 'discord.js';
import { formatDate } from '../../lib/Utility/Date';

const formatPresence = (activities: Activity[]) => {
    const push: string[] = [];
    for(const activity of activities) {
        switch(activity.type) {
            case 'CUSTOM_STATUS':
                push.push(`${activity.emoji ?? ' '}\`\`${activity.state}\`\``); break;
            case 'LISTENING':
                push.push(`Listening to ${activity.details} - ${activity.state ?? 'N/A'} on ${activity.name}.`); break;
            case 'PLAYING':
                push.push(`Playing *${activity.name}*.`); break;
            default:
                console.log(activity);
        }
    }

    return push.join('\n');
}

export default class extends Command {
    constructor() {
        super(
            [
                'Get info about a user.',
                '@Khafra#0001', '267774648622645249'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'member',
                folder: 'Server',
                aliases: [ 'memberinfo', 'whois' ],
                args: [0, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(message.mentions.members.size > 2) {
            return message.channel.send(this.Embed.fail('Too many people mentioned!'));
        }

        let member: GuildMember;
        try {
            member = await message.guild.members.fetch(args[0].replace(/[^\d]/g, ''));
        } catch {
            member = message.member;
        }

        const embed = this.Embed.success()
            .setDescription(`
            ${member} on *${member.guild.name}*.
            ${formatPresence(member.presence.activities)}
            
            Permissions: 
            \`\`${member.permissions.toArray().join(', ')}\`\`
            `)
            .setThumbnail(member.user.displayAvatarURL())
            .addField('**Username:**',   member.user.username, true)
            .addField('**ID:**',         member.id, true)
            .addField('**Role Color:**', member.displayHexColor, true)
            .addField('**Discrim:**',    `#${member.user.discriminator}`, true)
            .addField('**Nickname:**',   member.nickname ?? 'None', true)
            .addField('**Bot:**',        member.user.bot ? 'Yes' : 'No', true)
            .addField('**Created:**',     formatDate('MMMM Do, YYYY hh:mm:ss A t', member.user.createdAt), false)
        
        return message.channel.send(embed);
    }
}