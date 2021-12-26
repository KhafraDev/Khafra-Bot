import { Command } from '#khaf/Command';
import { Message, Activity } from 'discord.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { bold, inlineCode, italic, time } from '@khaf/builders';

const formatPresence = (activities: Activity[] | undefined) => {
    if (!Array.isArray(activities)) return '';
    
    const push: string[] = [];
    for (const activity of activities) {
        switch (activity.type) {
            case 'CUSTOM':
                push.push(`${activity.emoji ?? ''}${inlineCode(activity.state ?? 'N/A')}`); 
                break;
            case 'LISTENING':
                push.push(`Listening to ${activity.details} - ${activity.state ?? 'N/A'} on ${activity.name}.`); 
                break;
            case 'PLAYING':
                push.push(`Playing ${italic(activity.name)}.`); 
                break;
            default:
                console.log(activity);
        }
    }

    return push.join('\n');
}

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

    async init(message: Message<true>) {
        const member = await getMentions(message, 'members') ?? message.member;

        if (!member) {
            return this.Embed.error(`No guild member mentioned.`);
        }

        // max role length = 84 characters
        return this.Embed.ok()
            .setAuthor({ name: member.displayName, iconURL: member.user.displayAvatarURL() })
            .setDescription(`
            ${member} on ${italic(member.guild.name)}.
            ${formatPresence(member.presence?.activities)}
            
            Roles:
            ${[...member.roles.cache.filter(r => r.name !== '@everyone').values()].slice(0, 20).join(', ')}
            `)
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
                { name: bold('Role Color:'), value: member.displayHexColor, inline: true },
                { name: bold('Joined Guild:'), value: time(member.joinedAt ?? new Date()), inline: false },
                { 
                    name: bold('Boosting Since:'), 
                    value: member.premiumSince ? time(member.premiumSince) : 'Not boosting', 
                    inline: true 
                },
            )
            .setFooter('For general user info use the user command!');
    }
}