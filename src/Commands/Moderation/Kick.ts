import { Command } from '../../Structures/Command';
import { Message, GuildMember } from 'discord.js';
import Embed from '../../Structures/Embed';

export default class extends Command {
    constructor() {
        super(
            [
                'Kick a member from the server.',
                '@user for trolling',
                '1234567891234567'
            ],
            [ 'KICK_MEMBERS' ],
            {
                name: 'kick',
                folder: 'Moderation',
                args: [1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(Embed.missing_perms.call(this));
        } else if(args.length < 1) {
            return message.channel.send(Embed.missing_args.call(this, 1));
        }

        const mentions = message.mentions.members;
        let member: GuildMember;
        // only 1 member mentioned and the mention isn't the bot itself.
        if(
            (mentions.size === 1 && mentions.first().id === message.guild.me.id)
            || (mentions.size === 0 && !isNaN(+args[0]) && args[0].length >= 17 && args[0].length <= 19)
        ) {
            try {
                member = await message.guild.members.fetch(args[0]);
            } catch(e) {
                this.logger.log(e.toString());
                return message.channel.send(Embed.fail('Member couldn\'t be fetched!'));
            }
        } else if(mentions.size > 1) { // @KhafraBot#0001 kick @user#0001 blah - @Mod#0001
            member = mentions.first().id === message.guild.me.id ? mentions.first(2).pop() : mentions.first();
        }

        if(!(member instanceof GuildMember)) {
            return message.channel.send(Embed.fail('Member couldn\'t be fetched!'));
        } else if(!member.kickable) {
            return message.channel.send(Embed.fail(`${member} is not kickable!`));
        }

        try {
            await member.kick(args.slice(1).join(' '));
            return message.channel.send(Embed.success(`Successfully kicked ${member}!`));
        } catch(e) {
            return message.channel.send(Embed.fail(`
            An unexpected error occurred!
            \`\`${e}\`\`
            `));
        }
    }
}