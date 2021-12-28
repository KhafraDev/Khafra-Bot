import { Command, Arguments } from '#khaf/Command';
import { Message, Permissions } from 'discord.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { hasPerms, hierarchy } from '#khaf/utility/Permissions.js';
import { kGuild } from '#khaf/types/KhafraBot.js';
import { isText } from '#khaf/utility/Discord.js';
import { bold, inlineCode } from '@khaf/builders';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';

const perms = new Permissions([
    Permissions.FLAGS.VIEW_CHANNEL,
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.EMBED_LINKS
]);

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

    async init(message: Message<true>, { args }: Arguments, settings: kGuild) {
        const member = await getMentions(message, 'members');

        if (!hierarchy(message.member, member)) {
            return this.Embed.error(`You cannot kick ${member}!`);
        }
        
        if (!member) {
            return this.Embed.error('No member was mentioned and/or an invalid ❄️ was used!');
        } else if (!member.kickable) {
            return this.Embed.error(`${member} is too high up in the hierarchy for me to kick.`);
        }

        const [kickError] = await dontThrow(member.kick(`Khafra-Bot: req. by ${message.author.tag} (${message.author.id}).`));

        if (kickError !== null) {
            return this.Embed.error(`An unexpected error occurred: ${inlineCode(kickError.message)}`);
        }

        await message.reply({ embeds: [this.Embed.error(`Kicked ${member} from the server!`)] });

        if (settings.mod_log_channel !== null) {
            const channel = message.guild.channels.cache.get(settings.mod_log_channel);
            
            if (!isText(channel) || !hasPerms(channel, message.guild.me, perms))
                return;

            const reason = args.slice(1).join(' ');
            return void channel.send({ embeds: [this.Embed.ok(`
            ${bold('Offender:')} ${member}
            ${bold('Reason:')} ${reason.length > 0 ? reason.slice(0, 100) : 'No reason given.'}
            ${bold('Staff:')} ${message.member}
            `).setTitle('Member Kicked')] });
        }
    }
}