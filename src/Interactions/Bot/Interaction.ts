import { Interactions } from '#khaf/Interaction';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';

export class kInteraction extends Interactions {
    constructor () {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'interaction',
            description: 'Interaction handler for the bot owner.',
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'delete',
                    description: 'Deletes an application globally or in the dev server, if it is in dev mode.',
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'command-name',
                            description: 'The name of the command to delete.',
                            required: true
                        },
                        {
                            type: ApplicationCommandOptionType.Boolean,
                            name: 'globally',
                            description: 'Override the dev detection.'
                        }
                    ]
                }
            ]
        };

        super(sc, {
            ownerOnly: true,
            deploy: false
        });
    }
}