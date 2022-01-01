import { Interactions } from '#khaf/Interaction';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { postToModLog } from '#khaf/utility/Discord/Interaction Util.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { Minimalist } from '#khaf/utility/Minimalist.js';
import { hasPerms, hierarchy } from '#khaf/utility/Permissions.js';
import { Range } from '#khaf/utility/Valid/Number.js';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { CommandInteraction, GuildMember, Permissions } from 'discord.js';
import { argv } from 'process';
import { bold, inlineCode, time as formatTime } from '@khaf/builders';

const notReally = ` (Not really, the bot is in ${inlineCode('dev')} mode!)`;
const pleaseInvite = `invite the bot to the guild using the ${inlineCode('invite')} command!`;

const timeOptions = {
    weeks: 604_800_000,
    days: 86_400_000,
    hours: 3_600_000,
    minutes: 60 * 1000,
    seconds: 1000
} as const;

const isDev = new Minimalist(argv.slice(2).join(' ')).get('dev') === true;
const inRange = Range({ min: 0, max: /* 28 days */ 2_419_200_000, inclusive: true });
const perms = new Permissions([
    Permissions.FLAGS.MODERATE_MEMBERS
]);

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'mute',
            description: 'Mute a guild member!',
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
                    description: 'An optional reason detailing why the member has been muted.'
                },
                // TODO(@KhafraDev): if Discord ever adds a date option... use that
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'weeks',
                    description: 'Number of weeks to mute this member for.'
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'days',
                    description: 'Number of days to mute this member for.'
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'hours',
                    description: 'Number of hours to mute this member for.'
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'minutes',
                    description: 'Number of minutes to mute this member for.'
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'seconds',
                    description: 'Number of seconds to mute this member for.'
                }
            ]
        };

        super(sc, {
            defer: true,
            permissions: perms
        });
    }

    async init(interaction: CommandInteraction) {
        if (!hasPerms(interaction.channel, interaction.member, perms)) {
            return `❌ You do not have permission to ban this member, try to ${pleaseInvite}`;
        } else if (!hasPerms(interaction.channel, interaction.guild?.me, perms)) {
            return `❌ I do not have permission to ban this member, try to ${pleaseInvite}`;
        }
        
        if (!interaction.guild && !interaction.guildId) {
            return `❌ Invalid permissions, ${pleaseInvite}`;
        }

        const [err] = interaction.guild
            ? [null, interaction.guild]
            : await dontThrow(interaction.client.guilds.fetch(interaction.guildId!));

        if (err !== null) {
            return `❌ I couldn't fetch this guild, ${pleaseInvite}`;
        }
            
        const member = interaction.options.getMember('member')

        if (member === null) {
            return `❌ No guild member to mute was provided - I can't kick someone not in the guild!`;
        } else if (!(member instanceof GuildMember)) {
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

        // Ok here we go
        let totalMs = 0;
        let totalTimeString = '';

        for (const [optionName, value] of Object.entries(timeOptions)) {
            const option = interaction.options.getInteger(optionName);

            if (option) {
                totalMs += option * value;
                totalTimeString += `${option}${optionName[0]}`;
            }
        }

        if (!inRange(totalMs)) {
            return `❌ The longest you can mute a member for is 28 days!`;
        }

        const time =  totalMs === 0 ? null : new Date(Date.now() + totalMs).toISOString();
        const reason = 
            interaction.options.getString('reason') ??
            `Mute requested by ${interaction.user.tag} (${interaction.user.id})!`;
        const [muteErr] = isDev
            ? [null, member]
            : await dontThrow(member.disableCommunicationUntil(time, reason));

        if (muteErr !== null) {
            return `❌ An unexpected error has occurred: ${inlineCode(muteErr.message)}`;
        }

        const action = totalTimeString === '' ? 'unmuted' : 'muted';
        const timeDisplay = totalTimeString === '' ? '!' : ` for ${totalTimeString}!`;

        try {
            return Embed.ok(`${member} has been ${action}${timeDisplay}${isDev ? notReally : ''}`);
        } finally {
            const embed = Embed.ok(`
            ${bold('User:')} ${member}
            ${bold('ID:')} ${member.id}
            ${bold('Staff:')} ${interaction.user}
            ${bold('Ends:')} ${formatTime(Math.floor(totalMs / 1000), 'f')}
            ${bold('Reason:')} ${inlineCode(reason)}
            `).setTitle('Muted Member');

            void postToModLog(interaction, [embed]);
        }
    }
} 