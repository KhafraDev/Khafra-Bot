import { Interactions } from '#khaf/Interaction';
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';

export class kInteraction extends Interactions {
    constructor () {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'reminders',
            description: 'Handle and modify your reminders!',
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'create',
                    description: 'Create a reminder',
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'message',
                            description: 'The message the bot should remind you of.',
                            required: true
                        },
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'time',
                            description: 'When the bot should remind you (ie. "1h 30m" "2w 3d").',
                            required: true
                        },
                        {
                            type: ApplicationCommandOptionType.Boolean,
                            name: 'repeat',
                            description: 'If this reminder should be repeatedly sent to you on an interval (default is false).'
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'edit',
                    description: 'Edits an existing reminder',
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'id',
                            description: 'The ID of the reminder.',
                            required: true
                        },
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'message',
                            description: 'The new message the bot should remind you of.'
                        },
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'time',
                            description: 'When the bot should now remind you (ie. "1h 30m" "2w 3d").'
                        },
                        {
                            type: ApplicationCommandOptionType.Boolean,
                            name: 'repeat',
                            description: 'If this reminder should be repeatedly sent to you on an interval.'
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'fetch',
                    description: 'Fetches a list of your current reminders.',
                    options: [
                        {
                            type: ApplicationCommandOptionType.Integer,
                            name: 'amount',
                            description: 'Number of reminders to fetch.',
                            max_value: 100,
                            min_value: 1
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'delete',
                    description: 'Deletes one or more reminders.',
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'id',
                            description: 'ID(s) to delete, comma separated for multiple.',
                            required: true
                        }
                    ]
                }
            ]
        };

        super(sc);
    }
}