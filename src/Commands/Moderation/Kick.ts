import { Command, Arguments } from '../../Structures/Command.js';
import { Permissions } from 'discord.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { hasPerms, hierarchy } from '../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { kGuild } from '../../lib/types/KhafraBot.js';
import { isText, Message } from '../../lib/types/Discord.js.js';
import { bold } from '@discordjs/builders';

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

    async init(message: Message, { args }: Arguments, settings: kGuild) {
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
            await member.kick(`Khafra-Bot: req. by ${message.author.tag} (${message.author.id}).`);
        } catch {
            return this.Embed.fail(`
            An unexpected error occurred!
            `);
        }

        await message.reply({ embeds: [this.Embed.fail(`Kicked ${member} from the server!`)] });

        if (settings.mod_log_channel !== null) {
            const channel = message.guild.channels.cache.get(settings.mod_log_channel);
            
            if (!isText(channel) || !hasPerms(channel, message.guild.me, [ Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS ]))
                return;

            const reason = args.slice(1).join(' ');
            return void channel.send({ embeds: [this.Embed.success(`
            ${bold('Offender:')} ${member}
            ${bold('Reason:')} ${reason.length > 0 ? reason.slice(0, 100) : 'No reason given.'}
            ${bold('Staff:')} ${message.member}
            `).setTitle('Member Kicked')] });
        }
    }
}