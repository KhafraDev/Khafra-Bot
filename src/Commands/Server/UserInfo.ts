import Command from '../../Structures/Command';
import { Message, MessageEmbed, GuildMember, Activity } from 'discord.js';

export default class extends Command {
    constructor() {
        super(
            'user',
            'Get info about a user.',
            [ 'SEND_MESSAGES', 'EMBED_LINKS' ]
        );
    }

    async init(message: Message, args: string[]): Promise<Message> {
        if(!super.hasPermissions(message)) {
            return message.channel.send(this.failEmbed(`
            One of us doesn't have the needed permissions!

            Both of us must have \`\`${this.permissions.join(', ')}\`\` permissions to use this command!
            `));
        }

        return message.channel.send(await this.formatEmbed(message, args.shift()));
    }

    async formatEmbed(message: Message, id): Promise<MessageEmbed> {
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

        const embed = new MessageEmbed()
            .setDescription(`
            ${member.displayName} on *${member.guild.name}*.
            ${this.formatPresence(member.presence.activities)}
            
            Permissions: 
            \`\`${perms}\`\`
            `)
            .setThumbnail(member.user.displayAvatarURL() ?? member.user.defaultAvatarURL)
            .addField('**Tag:**', member.user.tag, true)
            .addField('**Role Color:**', member.displayHexColor, true)
            .addField('**ID:**', member.id, true)
            .addField('**Discrim:**', member.user.discriminator, true)
            .addField('**Nickname:**', member.nickname ?? 'None', true)
            .addField('**Bot:**', member.user.bot ? 'Yes' : 'No', true)
        
        return embed;
    }

    formatPresence(activities: Activity[]): string {
        const push = [];
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