import { Command } from '../../../Structures/Command.js';
import { Message, Activity } from 'discord.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { time } from '@discordjs/builders';

const formatPresence = (activities: Activity[]) => {
    const push: string[] = [];
    for (const activity of activities) {
        switch (activity.type) {
            case 'CUSTOM':
                push.push(`${activity.emoji ?? ''}\`\`${activity.state ?? 'N/A'}\`\``); 
                break;
            case 'LISTENING':
                push.push(`Listening to ${activity.details} - ${activity.state ?? 'N/A'} on ${activity.name}.`); 
                break;
            case 'PLAYING':
                push.push(`Playing *${activity.name}*.`); 
                break;
            default:
                console.log(activity);
        }
    }

    return push.join('\n');
}

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get info about a guild member.',
                '@Khafra#0001', '267774648622645249'
            ],
			{
                name: 'member',
                folder: 'Server',
                aliases: [ 'memberinfo', 'whois' ],
                args: [0, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message) {
        const member = await getMentions(message, 'members') ?? message.member;

        // max role length = 84 characters
        return this.Embed.success()
            .setAuthor(member.displayName, member.user.displayAvatarURL())
            .setDescription(`
            ${member} on *${member.guild.name}*.
            ${formatPresence(member.presence.activities)}
            
            Roles:
            ${member.roles.cache.filter(r => r.name !== '@everyone').array()?.slice(0, 20).join(', ')}
            `)
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
                { name: '**Role Color:**', value: member.displayHexColor, inline: true },
                { name: '**Joined Guild:**', value: time(member.joinedAt), inline: false },
                { 
                    name: '**Boosting Since:**', 
                    value: member.premiumSince ? time(member.premiumSince) : 'Not boosting', 
                    inline: true 
                },
            )
            .setFooter('For general user info use the **user** command!');
    }
}