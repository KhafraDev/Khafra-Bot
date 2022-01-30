import { Interactions } from '#khaf/Interaction';
import {
    ApplicationCommandOptionType,
    PermissionFlagsBits,
    RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v9';

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'warns',
            description: 'Handle warnings in this guild.',
            default_permission: false,
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'warn',
                    description: 'Warns a user.',
                    options: [
                        {
                            type: ApplicationCommandOptionType.User,
                            name: 'member',
                            description: 'The member that is being warned.',
                            required: true
                        },
                        {
                            type: ApplicationCommandOptionType.Integer,
                            name: 'points',
                            description: 'The number of warning points to give to the user.',
                            required: true,
                            min_value: 0,
                            max_value: 32_767
                        },
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'reason',
                            description: 'The reason this member is being warned.'
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'get',
                    description: 'Stops a running giveaway.',
                    options: [
                        {
                            type: ApplicationCommandOptionType.User,
                            name: 'member',
                            description: 'The member to get the warnings of.',
                            required: true
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'remove',
                    description: `Remove a warning from a user.`,
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'id',
                            description: `The ID of the warning (use /warns get to list warning IDs).`,
                            required: true
                        }
                    ]
                }
            ]
        };
        
        super(sc, {
            defer: true,
            permissions: [
                PermissionFlagsBits.KickMembers
            ]
        });
    }
}