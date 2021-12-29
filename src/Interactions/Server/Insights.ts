import { KhafraClient } from '#khaf/Bot';
import { Interactions } from '#khaf/Interaction';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { CommandInteraction, Permissions } from 'discord.js';

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
                Permissions.FLAGS.VIEW_GUILD_INSIGHTS
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