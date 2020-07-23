import { Command } from '../../Structures/Command';
import { Message, GuildMember, Activity } from 'discord.js';
import Embed from '../../Structures/Embed';
import { formatDate } from '../../Helpers/Date';

export default class extends Command {
    constructor() {
        super(
            'user',
            'Get info about a user.',
            [ /* No extra perms needed */ ],
            5,
            [ 'userinfo' ]
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(Embed.missing_perms(this.permissions));
        }

        return message.channel.send(await this.formatEmbed(message, args.shift()));
    }

    async formatEmbed(message: Message, id: string) {
        let member: GuildMember; // = message.mentions.members?.first() ?? message.member;
        if(id && !message.mentions.members.first()) {
            try {
                member = await message.guild.members.fetch(id);
            } catch{
                member = message.member;
            }
        } else {
            member = message.mentions.members?.first() ?? message.member;
        }
        const perms = member.permissions.toArray().join(', ');

        const embed = Embed.success()
            .setDescription(`
            ${member.displayName} on *${member.guild.name}*.
            ${this.formatPresence(member.presence.activities)}
            
            Permissions: 
            \`\`${perms}\`\`
            `)
            .setThumbnail(member.user.displayAvatarURL())
            .addField('**Username:**',   member.user.username, true)
            .addField('**Role Color:**', member.displayHexColor, true)
            .addField('**ID:**',         member.id, true)
            .addField('**Discrim:**',    member.user.discriminator, true)
            .addField('**Nickname:**',   member.nickname ?? 'None', true)
            .addField('**Bot:**',        member.user.bot ? 'Yes' : 'No', true)
            .addField('**Joined:**',     formatDate('MMMM Do, YYYY kk:mm:ssA', member.user.createdAt), false)
        
        return embed;
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