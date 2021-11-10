import { CommandInteraction, GuildMember, Permissions, User } from 'discord.js';
import { Interactions } from '../../Structures/Interaction.js';
import { inlineCode } from '@khaf/builders';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';
import { Minimalist } from '../../lib/Utility/Minimalist.js';
import { hasPerms, hierarchy } from '../../lib/Utility/Permissions.js';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';

const pleaseInvite = `invite the bot to the guild using the ${inlineCode('invite')} command!`;
const notReally = ` (Not really, the bot is in ${inlineCode('dev')} mode!)`;
const processArgs = new Minimalist(process.argv.slice(2).join(' '));
const perms = [ Permissions.FLAGS.KICK_MEMBERS ];

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'kick',
            description: 'Kick a guild member!',
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

        super(sc, { defer: true });
    }

    async init(interaction: CommandInteraction) {
        if (!hasPerms(interaction.channel, interaction.member, perms)) {
            return `❌ You do not have permission to kick this member, try to ${pleaseInvite}`;
        } else if (!hasPerms(interaction.channel, interaction.client.user, perms)) {
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
            : await dontThrow(interaction.client.guilds.fetch(interaction.guildId));

        if (err !== null) {
            return `❌ I couldn't fetch this guild, ${pleaseInvite}`;
        }
            
        const member = 
            interaction.options.getMember('member', true)
            interaction.options.getUser('member', true);

        if (!(member instanceof GuildMember) && !(member instanceof User)) {
            return `❌ No full member or user object was found, ${pleaseInvite}`;
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

        return Embed.success(`
        ${kicked} has been kicked from the guild!${processArgs.get('dev') ? notReally : ''}

        Reason: ${inlineCode(reason.slice(0, 1000))}
        `)
        .setAuthor(interaction.user.username, interaction.user.displayAvatarURL());
    }
} 