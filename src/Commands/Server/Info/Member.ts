import { Arguments, Command } from '#khaf/Command';
import { logger } from '#khaf/Logger';
import { getMentions } from '#khaf/utility/Mentions.js';
import { bold, inlineCode, italic, time } from '@khaf/builders';
import { ActivityType } from 'discord-api-types/v9';
import { Activity, Message } from 'discord.js';

const formatPresence = (activities: Activity[] | undefined) => {
    if (!Array.isArray(activities)) return '';
    
    const push: string[] = [];
    for (const activity of activities) {
        switch (activity.type) {
            case ActivityType.Custom:
                push.push(`${activity.emoji ?? ''}${inlineCode(activity.state ?? 'N/A')}`); 
                break;
            case ActivityType.Listening:
                push.push(`Listening to ${activity.details} - ${activity.state ?? 'N/A'} on ${activity.name}.`); 
                break;
            case ActivityType.Game:
                push.push(`Playing ${italic(activity.name)}.`); 
                break;
            default:
                logger.log(activity);
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

    async init(message: Message<true>, { content }: Arguments) {
        const member = await getMentions(message, 'members', content) ?? message.member;

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
            .setFooter({ text: 'For general user info use the user command!' });
    }
}