import Command from '../../Structures/Command';
import { Message, GuildMember, MessageEmbed } from 'discord.js';

export default class extends Command {
    constructor() {
        super(
            'kick',
            'Kick a member from the server.',
            [ 'SEND_MESSAGES', 'KICK_MEMBERS', 'EMBED_LINKS' ]
        );
    }

    async init(message: Message, args: string[]): Promise<Message> {
        if(!super.hasPermissions(message)) {
            return message.channel.send(this.failEmbed(`
            One of us doesn't have the needed permissions!

            Both of us must have \`\`${this.permissions.join(', ')}\`\` permissions to use this command!
            `));
        } else if(args.length < 1) {
            return message.channel.send(this.failEmbed(`
            Required at least 1 argument, received 0!

            Examples:
            \`\`kick @user for trolling\`\`
            \`\`kick 1234567891234567\`\`
            `));
        }

        let member: GuildMember;
        if(args.length > 0 && !message.mentions.members?.first()) {
            try {
                member = await message.guild.members.fetch(args[0])
            } catch {
                return message.channel.send(this.failEmbed(`
                *${args[0]}* is not a valid member!

                Examples:
                \`\`kick @user for trolling\`\`
                \`\`kick 1234567891234567\`\`
                `));
            }
        } else {
            member = message.mentions.members.first();
        }

        if(!member.kickable) {
            return message.channel.send(this.failEmbed('Member is not kickable!'));
        }

        await member.kick(args.slice(1).join(' '));
        return message.channel.send(this.formatEmbed(member, args.slice(1).join(' ')));
    }

    formatEmbed(user: GuildMember, reason?: string): MessageEmbed {
        const embed = new MessageEmbed()
            .setDescription(`**Successfully** kicked ${user}${reason.length ? ' for ' + reason : ''}!`)

        return embed;
    }
}