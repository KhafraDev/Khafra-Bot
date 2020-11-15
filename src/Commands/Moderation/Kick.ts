import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { getMentions, validSnowflake } from '../../lib/Utility/Mentions.js';

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
        const idOrUser = getMentions(message, args, { type: 'members' });
        if(!idOrUser || (typeof idOrUser === 'string' && !validSnowflake(idOrUser))) {
            return message.channel.send(this.Embed.generic('Invalid user ID!'));
        }
 
        let member = typeof idOrUser === 'string'
            ? message.guild.members.fetch(idOrUser)
            : idOrUser;

        if(member instanceof Promise) {
            try {
                member = await member;
            } catch {
                return message.channel.send(this.Embed.fail('Member couldn\'t be fetched!'));
            }
        }

        if(!member.kickable) {
            return message.channel.send(this.Embed.fail(`${member} is too high up in the hierarchy for me to kick.`));
        }

        try {
            await member.kick(args.slice(1).join(' '));
        } catch(e) {
            this.logger.log(e);
            return message.channel.send(this.Embed.fail(`
            An unexpected error occurred! This error has been logged and will be fixed if needed.
            `));
        }

        return message.channel.send(this.Embed.fail(`Kicked ${member} from the server!`));
    }
}