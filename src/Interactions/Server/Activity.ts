import { rest } from '#khaf/Bot';
import { Interactions } from '#khaf/Interaction';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { hideLinkEmbed, hyperlink, inlineCode } from '@khaf/builders';
import {
    APIInvite,
    ApplicationCommandOptionType, ChannelType,
    InviteTargetType, PermissionFlagsBits, RESTPostAPIApplicationCommandsJSONBody,
    RESTPostAPIChannelInviteJSONBody, Routes
} from 'discord-api-types/v9';
import { ChatInputCommandInteraction, VoiceChannel } from 'discord.js';

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
    'Spell Cast': '852509694341283871',
    'Checkers': '832013003968348200',
    // 'Sketchy Artist': '879864070101172255',
    'Putt Party': '832012854282158180',
} as const;

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'activity',
            description: 'Play a game in VC!',
            default_permission: false,
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'game',
                    description: 'The game you wish to play.',
                    required: true,
                    choices: Object.entries(Activities).map(([name, value]) => ({ name, value }))
                },
                {
                    type: ApplicationCommandOptionType.Channel,
                    name: 'channel',
                    description: 'Voice channel to play the game in!',
                    channel_types: [ ChannelType.GuildVoice ],
                    required: true
                }
            ]
        };

        super(sc, {
            permissions: [
                PermissionFlagsBits.CreateInstantInvite,
                PermissionFlagsBits.StartEmbeddedActivities
            ]
        });
    }

    async init (interaction: ChatInputCommandInteraction): Promise<string> {
        if (!interaction.inGuild()) {
            return `❌ This command is not available in this guild, please re-invite the bot with the correct permissions!`;
        } else if (!hasPerms(interaction.channel, interaction.guild?.me, this.options.permissions!)) {
            return `❌ I do not have perms to create an activity in this channel!`;
        }

        const activityId = interaction.options.getString('game', true);
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