import { Command } from '../../../Structures/Command.js';
import { Message, Activity, SnowflakeUtil } from 'discord.js';
import { formatDate } from '../../../lib/Utility/Date.js';

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

const epoch = new Date('January 1, 2015 GMT-0');
const zeroBinary = ''.padEnd(64, '0');

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
        const id = message.mentions.members.size > 0
            ? message.mentions.members.first().id
            : args[0]

        if(args.length !== 0) {
            const snowflake = SnowflakeUtil.deconstruct(id);
            if( 
                snowflake.date.getTime() === epoch.getTime()
                || snowflake.binary === zeroBinary
                || snowflake.timestamp > Date.now()
                || snowflake.timestamp === epoch.getTime() // just in case
            ) {
                return message.channel.send(this.Embed.generic('Invalid member ID!'));
            }
        }

        let member;
        try {
            if(message.mentions.members.size > 0) {
                member = message.mentions.members.first();
            } else if(args.length === 0) {
                member = message.member;
            } else {
                member = await message.guild.members.fetch(id);
            }
        } catch {
            return message.channel.send(this.Embed.generic('Invalid user ID!'));
        }

        // max role length = 84 characters
        const embed = this.Embed.success()
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
                { name: '**Joined Guild:**', value: formatDate('MMM. Do, YYYY hh:mm:ssA t', member.joinedAt), inline: false },
                { 
                    name: '**Boosting Since:**', 
                    value: member.premiumSince ? formatDate('MMM. Do, YYYY hh:mm:ssA t', member.premiumSince) : 'Not boosting', 
                    inline: true 
                },
            )
            .setFooter('For general user info use the **user** command!');
        
        return message.channel.send(embed);
    }
}