import { Command } from '../../Structures/Command.js';
import { Message, GuildMember, TextChannel } from 'discord.js';
import { getMentions, validSnowflake } from '../../lib/Utility/Mentions.js';
import { GuildSettings } from '../../lib/types/Collections.js';

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

    async init(message: Message, args: string[], settings: GuildSettings) {
        const idOrUser = getMentions(message, args, { type: 'members' });
        if(!idOrUser || (typeof idOrUser === 'string' && !validSnowflake(idOrUser))) {
            return message.reply(this.Embed.generic('Invalid user ID!'));
        }
 
        let member = typeof idOrUser === 'string'
            ? message.guild.members.fetch(idOrUser)
            : idOrUser;

        if(member instanceof Promise) {
            try {
                member = await member;
            } catch {
                return message.reply(this.Embed.fail('Member couldn\'t be fetched!'));
            }
        }

        if(!member.kickable) {
            return message.reply(this.Embed.fail(`${member} is too high up in the hierarchy for me to kick.`));
        }

        try {
            await (member as GuildMember).kick(`
            Khafra-Bot: req. by ${message.author.tag} (${message.author.id}).
            `);
        } catch {
            return message.reply(this.Embed.fail(`
            An unexpected error occurred!
            `));
        }

        await message.reply(this.Embed.fail(`Kicked ${member} from the server!`));

        if(typeof settings?.modActionLogChannel === 'string') {
            const channel = message.guild.channels.cache.get(settings.modActionLogChannel) as TextChannel;
            if(channel?.type !== 'text') {
                return;
            } else if(!channel.permissionsFor(message.guild.me).has([ 'SEND_MESSAGES', 'EMBED_LINKS' ])) {
                return;
            }

            const reason = args.slice(1).join(' ');
            return channel.send(this.Embed.success(`
            **Offender:** ${idOrUser}
            **Reason:** ${reason.length > 0 ? reason.slice(0, 100) : 'No reason given.'}
            **Staff:** ${message.member}
            `).setTitle('Member Kicked'));
        }
    }
}