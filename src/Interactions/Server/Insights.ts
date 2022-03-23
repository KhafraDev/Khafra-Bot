import { Interactions } from '#khaf/Interaction';
import { ApplicationCommandOptionType, PermissionFlagsBits, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'insights',
            description: 'Guild insight settings.',
            default_permission: false,
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'view',
                    description: 'Views the guild insights from the last two weeks!'
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'today',
                    description: 'View the current insights for the day.'
                }
            ]
        };

        super(sc, {
            defer: true,
            permissions: [
                PermissionFlagsBits.ViewGuildInsights
            ]
        });
    }
}