import { KhafraClient } from '#khaf/Bot';
import { Interactions } from '#khaf/Interaction';
import { ApplicationCommandOptionType, ChannelType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { CommandInteraction, Permissions } from 'discord.js';

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'giveaway',
            description: 'Giveaway settings.',
            default_permission: false,
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'create',
                    description: 'Create a giveaway in the guild.',
                    options: [
                        {
                            type: ApplicationCommandOptionType.Channel,
                            name: 'channel',
                            description: 'Channel to create the giveaway in.',
                            required: true,
                            channel_types: [
                                ChannelType.GuildNews, ChannelType.GuildText
                            ]
                        },
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'prize',
                            description: 'The prize that is being given away.',
                            required: true
                        },
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'ends',
                            description: 'How long the giveaway should last (for example: "1h 30m" or "2w 3d 1h").',
                            required: true
                        },
                        {
                            type: ApplicationCommandOptionType.Integer,
                            name: 'winners',
                            description: 'The number of winners there should be, defaults to 1.',
                            min_value: 1,
                            max_value: 100
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'delete',
                    description: 'Stops a running giveaway.',
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'id',
                            description: 'The id of the giveaway.',
                            required: true
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'reroll',
                    description: `Rerolls a giveaway that has ended, picking new winners.`,
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'url',
                            description: `The link to the giveaway message.`,
                            required: true
                        }
                    ]
                }
            ]
        };
        
        super(sc, {
            defer: true,
            permissions: [
                Permissions.FLAGS.MANAGE_EVENTS
            ]
        });
    }

    async init(interaction: CommandInteraction) {
        const subcommand = interaction.options.getSubcommand();
        const subcommandName = `${this.data.name}-${subcommand}`;

        if (!KhafraClient.Subcommands.has(subcommandName)) {
            return `❌ This option has not been implemented yet!`;
        }

        const option = KhafraClient.Subcommands.get(subcommandName)!;
        
        return await option.handle(interaction);
    }
}