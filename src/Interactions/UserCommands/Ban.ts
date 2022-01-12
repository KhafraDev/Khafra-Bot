import { InteractionUserCommand } from '#khaf/Interaction';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { Minimalist } from '#khaf/utility/Minimalist.js';
import { hasPerms, hierarchy } from '#khaf/utility/Permissions.js';
import { inlineCode } from '@khaf/builders';
import { ApplicationCommandType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { GuildMember, Permissions, User, UserContextMenuCommandInteraction } from 'discord.js';
import { argv } from 'process';

const pleaseInvite = `invite the bot to the guild using the ${inlineCode('invite')} command!`;
const notReally = ` (Not really, the bot is in ${inlineCode('dev')} mode!)`;
const processArgs = new Minimalist(argv.slice(2).join(' '));
const perms = [ Permissions.FLAGS.BAN_MEMBERS ];

export class kUserCommand extends InteractionUserCommand {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'Ban User',
            type: ApplicationCommandType.User
        };
        
        super(sc);
    }

    async init (interaction: UserContextMenuCommandInteraction) {
        if (!hasPerms(interaction.channel, interaction.member, perms)) {
            return `❌ You do not have permission to ban this member, try to ${pleaseInvite}`;
        } else if (!hasPerms(interaction.channel, interaction.guild?.me, perms)) {
            return `❌ I do not have permission to ban this member, try to ${pleaseInvite}`;
        }

        const reason = `Ban requested by ${interaction.user.tag} (${interaction.user.id}).`;

        if (!interaction.guild && !interaction.guildId) {
            return `❌ Invalid permissions, ${pleaseInvite}`;
        }

        const [err, guild] = interaction.guild
            ? [null, interaction.guild]
            : await dontThrow(interaction.client.guilds.fetch(interaction.guildId!));

        if (err !== null) {
            return `❌ I couldn't fetch this guild, ${pleaseInvite}`;
        }

        const member = interaction.targetMember ?? interaction.targetUser;

        if (!(member instanceof GuildMember) && !(member instanceof User)) {
            return `❌ Re-invite the bot with the correct permissions to use this command!`;
        } else if (
            member instanceof GuildMember && 
            interaction.member instanceof GuildMember
        ) {
            if (!hierarchy(interaction.member, member)) {
                return `❌ You are lower in the hierarchy than ${member}, you can't ban them!`;
            } else if (interaction.guild?.me != null && !hierarchy(interaction.member, interaction.guild.me)) {
                return `❌ I am lower in the hierarchy than ${member}, I can't ban them!`;
            }
        }

        const [banErr, banned] = processArgs.get('dev')
            ? [null, interaction.targetId]
            : await dontThrow(guild.bans.create(interaction.targetId, { days: 7, reason }));

        if (banErr !== null) {
            return `❌ An unexpected error has occurred: ${inlineCode(banErr.message)}`;
        }

        return Embed.ok(`
        ${banned} has been banned from the guild!${processArgs.get('dev') ? notReally : ''}

        Reason: ${inlineCode(reason.slice(0, 1000))}
        `)
        .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL()
        })
        .setFooter({ text: `7 days of messages removed.` });
    }
} 