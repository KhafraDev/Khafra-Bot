import { Command } from '../../Structures/Command';
import { Message, GuildMember } from 'discord.js';
import Embed from '../../Structures/Embed';
import { inspect } from 'util';

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
        }

        if(!/(<@!)?\d{17,19}>?/.test(args[0])) {
            return message.channel.send(Embed.fail(`
            No guild member mentioned and no user ID provided.
            `));
        }

        let member: GuildMember;
        try {
            member = await message.guild.members.fetch(args[0].replace(/[^\d]/g, ''));
        } catch {
            return message.channel.send(Embed.fail('Invalid ID provided or member mentioned!'));
        }

        if(!member.kickable) {
            return message.channel.send(Embed.fail(`${member} is too high up in the hierarchy for me to kick.`));
        }

        try {
            await member.kick(args.slice(1).join(' '));
        } catch(e) {
            this.logger.log(inspect(e));
            return message.channel.send(Embed.fail(`
            An unexpected error occurred! This error has been logged and will be fixed if needed.
            `));
        }

        return message.channel.send(Embed.success(`Kicked ${member} from the server!`));
    }
}