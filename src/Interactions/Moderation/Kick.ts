import { Interactions } from '#khaf/Interaction';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { postToModLog } from '#khaf/utility/Discord/Interaction Util.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { Minimalist } from '#khaf/utility/Minimalist.js';
import { hasPerms, hierarchy } from '#khaf/utility/Permissions.js';
import { bold, inlineCode, time } from '@khaf/builders';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { ChatInputCommandInteraction, GuildMember, Permissions, User } from 'discord.js';
import { argv } from 'process';

const pleaseInvite = `invite the bot to the guild using the ${inlineCode('invite')} command!`;
const notReally = ` (Not really, the bot is in ${inlineCode('dev')} mode!)`;
const processArgs = new Minimalist(argv.slice(2).join(' '));
const perms = [ Permissions.FLAGS.KICK_MEMBERS ];

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'kick',
            description: 'Kick a guild member!',
            default_permission: false,
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: 'member',
                    description: 'Member to kick.',
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'reason',
                    description: 'The reason you are kicking the member for.'
                }
            ]
        };

        super(sc, {
            defer: true,
            permissions: [
                Permissions.FLAGS.KICK_MEMBERS
            ]
        });
    }

    async init(interaction: ChatInputCommandInteraction) {
        if (!hasPerms(interaction.channel, interaction.member, perms)) {
            return `❌ You do not have permission to kick this member, try to ${pleaseInvite}`;
        } else if (!hasPerms(interaction.channel, interaction.guild?.me, perms)) {
            return `❌ I do not have permission to kick this member, try to ${pleaseInvite}`;
        }

        const reason =
            interaction.options.getString('reason') ??
            `Kick requested by ${interaction.user.tag} (${interaction.user.id}).`;

        if (!interaction.guild && !interaction.guildId) {
            return `❌ Invalid permissions, ${pleaseInvite}`;
        }

        const [err, guild] = interaction.guild
            ? [null, interaction.guild]
            : await dontThrow(interaction.client.guilds.fetch(interaction.guildId!));

        if (err !== null) {
            return `❌ I couldn't fetch this guild, ${pleaseInvite}`;
        }
            
        const member = 
            interaction.options.getMember('member') ??
            interaction.options.getUser('member', true);

        if (!(member instanceof GuildMember) && !(member instanceof User)) {
            return `❌ Re-invite the bot with the correct permissions to use this command!`;
        } else if (
            member instanceof GuildMember && 
            interaction.member instanceof GuildMember
        ) {
            if (!hierarchy(interaction.member, member)) {
                return `❌ You are lower in the hierarchy than ${member}, you can't kick them!`;
            } else if (interaction.guild?.me != null && !hierarchy(interaction.member, interaction.guild.me)) {
                return `❌ I am lower in the hierarchy than ${member}, I can't kick them!`;
            }
        }

        const [kickErr, kicked] = processArgs.get('dev')
            ? [null, member]
            : await dontThrow(guild.members.kick(member.id, reason));

        if (kickErr !== null) {
            return `❌ An unexpected error has occurred: ${inlineCode(kickErr.message)}`;
        }

        try {
            return Embed.ok(`
            ${kicked} has been kicked from the guild!${processArgs.get('dev') ? notReally : ''}

            Reason: ${inlineCode(reason.slice(0, 1000))}
            `)
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL()
            });
        } finally {
            const embed = Embed.ok(`
            ${bold('User:')} ${kicked}
            ${bold('ID:')} ${typeof kicked === 'string' ? kicked : kicked.id}
            ${bold('Staff:')} ${interaction.user}
            ${bold('Time:')} ${time(new Date())}
            ${bold('Reason:')} ${inlineCode(reason)}
            `).setTitle('Member Kicked');

            void postToModLog(interaction, [embed]);
        }
    }
} 