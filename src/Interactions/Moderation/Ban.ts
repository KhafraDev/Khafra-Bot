import { Interactions } from '#khaf/Interaction';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { Minimalist } from '#khaf/utility/Minimalist.js';
import { hasPerms, hierarchy } from '#khaf/utility/Permissions.js';
import { plural } from '#khaf/utility/String.js';
import { inlineCode } from '@khaf/builders';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { CommandInteraction, GuildMember, Permissions, User } from 'discord.js';
import { argv } from 'process';

const pleaseInvite = `invite the bot to the guild using the ${inlineCode('invite')} command!`;
const notReally = ` (Not really, the bot is in ${inlineCode('dev')} mode!)`;
const processArgs = new Minimalist(argv.slice(2).join(' '));
const perms = [ Permissions.FLAGS.BAN_MEMBERS ];

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'ban',
            description: 'Ban someone!',
            default_permission: false,
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: 'member',
                    description: 'Member to ban.',
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'days',
                    description: 'Days of messages to clear (default is 7).'
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'reason',
                    description: 'The reason you are banning the member for.'
                }
            ]
        };

        super(sc, {
            defer: true,
            permissions: [
                Permissions.FLAGS.BAN_MEMBERS
            ]
        });
    }

    async init(interaction: CommandInteraction) {
        if (!hasPerms(interaction.channel, interaction.member, perms)) {
            return `❌ You do not have permission to ban this member, try to ${pleaseInvite}`;
        } else if (!hasPerms(interaction.channel, interaction.guild?.me, perms)) {
            return `❌ I do not have permission to ban this member, try to ${pleaseInvite}`;
        }

        const daysOpt = interaction.options.getInteger('days') ?? 7;
        const days = daysOpt > 7 ? daysOpt % 7 : daysOpt;

        const reason =
            interaction.options.getString('reason') ??
            `Ban requested by ${interaction.user.tag} (${interaction.user.id}).`;

        if (!interaction.guild && !interaction.guildId) {
            return `❌ Invalid permissions, ${pleaseInvite}`;
        }

        const [err, guild] = interaction.guild
            ? [null, interaction.guild]
            : await dontThrow(interaction.client.guilds.fetch(interaction.guildId!));

        if (err !== null) {
            return `❌ I couldn't fetch this guild, ${pleaseInvite}`;
        }
            
        let member = 
            interaction.options.getMember('member') ??
            interaction.options.getUser('member', true);

        if (!(member instanceof GuildMember) && !(member instanceof User)) {
            member = Reflect.construct(GuildMember, [
                interaction.client,
                member,
                guild
            ]) as GuildMember;
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
            ? [null, member]
            : await dontThrow(guild.bans.create(member.id, { days }));

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
        .setFooter(`${days} day${plural(days)} of messages removed.`);
    }
}