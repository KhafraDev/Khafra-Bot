import { Command } from '../../Structures/Command';
import { Message, GuildMember } from 'discord.js';
import Embed from '../../Structures/Embed';

export default class extends Command {
    constructor() {
        super(
            { name: 'kick', folder: 'Moderation' },
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
            return message.channel.send(Embed.missing_args(1, this.name.name, this.help.slice(1)));
        }

        let member: GuildMember = message.mentions.members.first();
        if(args.length > 0 && !member) {
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
        }

        if(!member.kickable) {
            return message.channel.send(Embed.fail(`${member} is not kickable!`));
        }

        await member.kick(args.slice(1).join(' '));
        
        const embed = Embed.success(`**Successfully** kicked ${member}${args.slice(1).join(' ').length ? ' for ' + args.slice(1).join(' ') : ''}!`);

        return message.channel.send(embed);
    }
}