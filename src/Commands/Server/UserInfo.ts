import { Command } from '../../Structures/Command';
import { Message, GuildMember, Activity } from 'discord.js';
import Embed from '../../Structures/Embed';
import { formatDate } from '../../lib/Utility/Date';

export default class extends Command {
    constructor() {
        super(
            { name: 'user', folder: 'Server' },
            [
                'Get info about a user.',
                '@Khafra#0001', '267774648622645249'
            ],
            [ /* No extra perms needed */ ],
            5,
            [ 'userinfo' ]
        );
    }

    async init(message: Message, args: string[]) {
        let member: GuildMember;
        if(args[0] && !message.mentions.members.first()) {
            try {
                member = await message.guild.members.fetch(args[0]);
            } catch{
                member = message.member;
            }
        } else {
            member = message.mentions.members.first() ?? message.member;
        }

        const embed = Embed.success()
            .setDescription(`
            ${member} on *${member.guild.name}*.
            ${this.formatPresence(member.presence.activities)}
            
            Permissions: 
            \`\`${member.permissions.toArray().join(', ')}\`\`
            `)
            .setThumbnail(member.user.displayAvatarURL())
            .addField('**Username:**',   member.user.username, true)
            .addField('**Role Color:**', member.displayHexColor, true)
            .addField('**ID:**',         member.id, true)
            .addField('**Discrim:**',    member.user.discriminator, true)
            .addField('**Nickname:**',   member.nickname ?? 'None', true)
            .addField('**Bot:**',        member.user.bot ? 'Yes' : 'No', true)
            .addField('**Joined:**',     formatDate('MMMM Do, YYYY hh:mm:ss A t', member.user.createdAt), false)
        
        return message.channel.send(embed);
    }

    formatPresence(activities: Activity[]) {
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
}