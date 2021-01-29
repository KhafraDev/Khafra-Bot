import { Command } from '../../Structures/Command.js';
import { Message, TextChannel, Permissions } from 'discord.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { GuildSettings } from '../../lib/types/Collections.js';

export default class extends Command {
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

    async init(message: Message, args: string[], settings: GuildSettings) {
        const member = await getMentions(message, 'members');

        if (!member) {
            return message.reply(this.Embed.fail('No member was mentioned and/or an invalid ❄️ was used!'));
        } else if (!member.kickable) {
            return message.reply(this.Embed.fail(`${member} is too high up in the hierarchy for me to kick.`));
        }

        try {
            await member.kick(`
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
            **Offender:** ${member}
            **Reason:** ${reason.length > 0 ? reason.slice(0, 100) : 'No reason given.'}
            **Staff:** ${message.member}
            `).setTitle('Member Kicked'));
        }
    }
}