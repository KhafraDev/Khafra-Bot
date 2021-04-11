import { Command, Arguments } from '../../Structures/Command.js';
import { Message, TextChannel, Permissions } from 'discord.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { GuildSettings } from '../../lib/types/Collections.js';
import { hasPerms, hierarchy } from '../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Kick a member from the server.',
                '@user for trolling',
                '1234567891234567'
            ],
			{
                name: 'kick',
                folder: 'Moderation',
                args: [1],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.KICK_MEMBERS ]
            }
        );
    }

    async init(message: Message, { args }: Arguments, settings: GuildSettings) {
        const member = await getMentions(message, 'members');

        if (!hierarchy(message.member, member)) {
            return this.Embed.fail(`You cannot kick ${member}!`);
        }
        
        if (!member) {
            return this.Embed.fail('No member was mentioned and/or an invalid ❄️ was used!');
        } else if (!member.kickable) {
            return this.Embed.fail(`${member} is too high up in the hierarchy for me to kick.`);
        }

        try {
            await member.kick(`
            Khafra-Bot: req. by ${message.author.tag} (${message.author.id}).
            `);
        } catch {
            return this.Embed.fail(`
            An unexpected error occurred!
            `);
        }

        await message.reply(this.Embed.fail(`Kicked ${member} from the server!`));

        if (typeof settings?.modActionLogChannel === 'string') {
            const channel = message.guild.channels.cache.get(settings.modActionLogChannel) as TextChannel;
            
            if (!hasPerms(channel, message.guild.me, [ Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS ]))
                return;

            const reason = args.slice(1).join(' ');
            return channel.send(this.Embed.success(`
            **Offender:** ${member}
            **Reason:** ${reason.length > 0 ? reason.slice(0, 100) : 'No reason given.'}
            **Staff:** ${message.member}
            `).setTitle('Member Kicked'));
        }
    }
}