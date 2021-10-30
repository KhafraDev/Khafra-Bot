import { CommandInteraction, Permissions, VoiceChannel } from 'discord.js';
import { Interactions } from '../../Structures/Interaction.js';
import { hideLinkEmbed, hyperlink, inlineCode, SlashCommandBuilder } from '@discordjs/builders';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { APIInvite, APIVersion, ChannelType, InviteTargetType, RESTPostAPIChannelInviteJSONBody, Routes } from 'discord-api-types/v9';
import { REST } from '@discordjs/rest';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';

const rest = new REST({ version: APIVersion }).setToken(process.env.TOKEN!);

const activityPerms = new Permissions([
    Permissions.FLAGS.CREATE_INSTANT_INVITE,
    Permissions.FLAGS.START_EMBEDDED_ACTIVITIES
]);

const Activities = {
    'Poker': '755827207812677713',
    'Betrayal.io': '773336526917861400',
    'YouTube Together': '755600276941176913',
    'Fishington.io': '814288819477020702',
    'Chess in the Park': '832012774040141894',
    'Doodle Crew': '878067389634314250',
    'Word Snacks': '879863976006127627',
    'Letter Tile': '879863686565621790',
    'Awkword': '879863881349087252',
    'Spell Cast': '852509694341283871'
} as const;

export class kInteraction extends Interactions {
    constructor() {
        const sc = new SlashCommandBuilder()
            .setName('activity')
            .addStringOption(option => option
                .setName('name')
                .setDescription('Name of the game to play')
                .addChoices(Object.entries(Activities))
                .setRequired(true)
            )
            .addChannelOption(option => option
                .setName('channel')
                .setDescription('Channel to play the activity in!')
                .addChannelTypes([ ChannelType.GuildVoice ])
                .setRequired(true)
            )
            .setDescription('Play a game in VC!');

        super(sc);
    }

    async init(interaction: CommandInteraction) {
        if (!interaction.inCachedGuild()) {
            return `❌ This command is not available in this guild, please re-invite the bot with the correct permissions!`;
        } else if (!hasPerms(interaction.channel, interaction.member, activityPerms)) {
            return `❌ You do not have the permissions needed to start an activity!`;
        } else if (!hasPerms(interaction.channel, interaction.guild.me, activityPerms)) {
            return `❌ I do not have perms to create an activity in this channel!`;
        }

        const activityId = interaction.options.getString('name', true);
        const channel = interaction.options.getChannel('channel', true) as VoiceChannel;

        const [fetchError, invite] = await dontThrow(rest.post(
            Routes.channelInvites(channel.id),
            {
                headers: { 'Content-Type': 'application/json' },
                body: {
                    max_age: 86400,
                    target_type: InviteTargetType.EmbeddedApplication,
                    target_application_id: activityId
                } as RESTPostAPIChannelInviteJSONBody
            }
        ) as Promise<APIInvite>);

        if (fetchError !== null) {
            return `❌ An unexpected error occurred: ${inlineCode(fetchError.message)}`;
        }

        const hl = hyperlink('Click Here', hideLinkEmbed(`https://discord.gg/${invite.code}`));
        const str = `${hl} to open ${invite.target_application!.name} in ${channel}!`;

        return str;
    }
} 