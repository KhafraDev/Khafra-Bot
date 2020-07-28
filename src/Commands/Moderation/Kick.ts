import { Command } from '../../Structures/Command';
import { Message, GuildMember } from 'discord.js';
import Embed from '../../Structures/Embed';

export default class extends Command {
    constructor() {
        super(
            'kick',
            [
                'Kick a member from the server.',
                '@user for trolling',
                '1234567891234567'
            ],
            [ 'KICK_MEMBERS' ],
            10
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(Embed.missing_perms(this.permissions));
        } else if(args.length < 1) {
            return message.channel.send(Embed.missing_args(1, this.name, this.help.slice(1)));
        }

        let member: GuildMember;
        if(args.length > 0 && !message.mentions.members?.first()) {
            try {
                member = await message.guild.members.fetch(args[0])
            } catch {
                return message.channel.send(Embed.fail(`
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
            return message.channel.send(Embed.fail('Member is not kickable!'));
        }

        await member.kick(args.slice(1).join(' '));
        
        const embed = Embed.success(`**Successfully** kicked ${member}${args.slice(1).join(' ').length ? ' for ' + args.slice(1).join(' ') : ''}!`);

        return message.channel.send(embed);
    }
}